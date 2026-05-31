import { createMCPClient } from "@ai-sdk/mcp"
import { anthropic } from "@ai-sdk/anthropic"
import { type ModelMessage, stepCountIs, streamText } from "ai"

import { createClient } from "@/lib/supabase/server"
import type { UserMessage } from "@/types/database"

export const runtime = "nodejs"

const CHAT_SYSTEM_PROMPT = `You are ChatPT, a concise training, rehab, and strength assistant for this authenticated user's personal training tracker.

Use the available MCP tools when user-specific training data would improve the answer.
Mutating tools are allowed only when the user has explicitly provided or confirmed the exact values to write in the current conversation.
Do not invent logged workouts, exercises, session dates, profile changes, or quality status changes.
If a write request is ambiguous, ask a short clarification question instead of calling a mutating tool.
Keep answers practical and specific to the user's training context.`

const FAILED_ASSISTANT_MESSAGE =
  "The request failed, try again later."

type ChatTurnRequest = {
  conversationId?: unknown
  content?: unknown
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing ${name}`)
  }

  return value
}

function getAnthropicModelName() {
  const modelName =
    process.env.CHATPT_LLM_MODEL?.trim() || "claude-sonnet-4-5-20250929"

  if (!modelName.startsWith("claude-")) {
    throw new Error("CHATPT_LLM_MODEL must be a Claude model.")
  }

  return modelName
}

function toModelMessages(messages: UserMessage[]): ModelMessage[] {
  return messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content,
    }))
}

function getConversationPreview(content: string) {
  const preview = content.trim().replace(/\s+/g, " ")

  if (preview.length <= 60) {
    return preview
  }

  return `${preview.slice(0, 57).trim()}...`
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

async function saveAssistantMessage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  {
    content,
    conversationId,
    status,
    userId,
  }: {
    content: string
    conversationId: string
    status: UserMessage["status"]
    userId: string
  }
) {
  await supabase.from("user_messages").insert({
    user_id: userId,
    conversation_id: conversationId,
    role: "assistant",
    status,
    content,
  })
}

export async function POST(request: Request) {
  let payload: ChatTurnRequest

  try {
    payload = (await request.json()) as ChatTurnRequest
  } catch {
    return jsonError("Invalid JSON payload.", 400)
  }

  const conversationId =
    typeof payload.conversationId === "string"
      ? payload.conversationId.trim()
      : ""
  const content =
    typeof payload.content === "string" ? payload.content.trim() : ""

  if (!conversationId) {
    return jsonError("Missing conversationId.", 400)
  }

  if (!content) {
    return jsonError("Message cannot be empty.", 400)
  }

  let mcpBaseUrl: string
  let modelName: string

  try {
    mcpBaseUrl = getRequiredEnv("CHATPT_MCP_BASE_URL")
    modelName = getAnthropicModelName()
    getRequiredEnv("ANTHROPIC_API_KEY")
  } catch (error) {
    const message = error instanceof Error ? error.message : "Missing server config."
    return jsonError(message, 500)
  }

  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !session?.access_token) {
    return jsonError("Unauthorized.", 401)
  }

  const userId = user.id

  const { data: conversation, error: conversationError } = await supabase
    .from("user_conversations")
    .select("id, title")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .neq("status", "deleted")
    .single()

  if (conversationError || !conversation) {
    return jsonError("Conversation not found.", 404)
  }

  const { data: userMessage, error: userMessageError } = await supabase
    .from("user_messages")
    .insert({
      user_id: userId,
      conversation_id: conversationId,
      role: "user",
      status: "complete",
      content,
    })
    .select("*")
    .single()

  if (userMessageError || !userMessage) {
    return jsonError(userMessageError?.message ?? "Could not save message.", 500)
  }

  const now = new Date().toISOString()
  const conversationUpdatePayload: {
    last_message_at: string
    title?: string
  } = {
    last_message_at: now,
  }

  if (conversation.title === "New conversation") {
    conversationUpdatePayload.title =
      getConversationPreview(content) || "New conversation"
  }

  await supabase
    .from("user_conversations")
    .update(conversationUpdatePayload)
    .eq("id", conversationId)
    .eq("user_id", userId)

  const { data: persistedMessages, error: messagesError } = await supabase
    .from("user_messages")
    .select("*")
    .eq("user_id", userId)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })

  if (messagesError) {
    return jsonError(messagesError.message, 500)
  }

  let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null = null
  let textStream: AsyncIterable<string>

  try {
    mcpClient = await createMCPClient({
      transport: {
        type: "http",
        url: mcpBaseUrl,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        redirect: "error",
      },
      clientName: "chatpt-web",
      version: "0.1.0",
    })

    const tools = await mcpClient.tools()
    const result = streamText({
      model: anthropic(modelName),
      system: CHAT_SYSTEM_PROMPT,
      messages: toModelMessages(persistedMessages ?? []),
      tools,
      stopWhen: stepCountIs(5),
      abortSignal: request.signal,
    })
    textStream = result.textStream
  } catch (error) {
    await mcpClient?.close().catch(() => undefined)
    await saveAssistantMessage(supabase, {
      userId,
      conversationId,
      status: "failed",
      content: FAILED_ASSISTANT_MESSAGE,
    })

    const message =
      error instanceof Error ? error.message : "Could not start chat turn."
    return jsonError(message, 500)
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let assistantContent = ""

      try {
        for await (const delta of textStream) {
          assistantContent += delta
          controller.enqueue(encoder.encode(delta))
        }

        if (!assistantContent.trim()) {
          await saveAssistantMessage(supabase, {
            userId,
            conversationId,
            status: "failed",
            content: FAILED_ASSISTANT_MESSAGE,
          })
          controller.enqueue(encoder.encode(FAILED_ASSISTANT_MESSAGE))
          return
        }

        await saveAssistantMessage(supabase, {
          userId,
          conversationId,
          status: "complete",
          content: assistantContent.trim(),
        })

        await supabase
          .from("user_conversations")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", conversationId)
          .eq("user_id", userId)
      } catch {
        const failureContent =
          assistantContent.trim() || FAILED_ASSISTANT_MESSAGE

        await saveAssistantMessage(supabase, {
          userId,
          conversationId,
          status: "failed",
          content: failureContent,
        })

        if (!assistantContent.trim()) {
          controller.enqueue(encoder.encode(FAILED_ASSISTANT_MESSAGE))
        }
      } finally {
        await mcpClient?.close().catch(() => undefined)
        controller.close()
      }
    },
    async cancel() {
      await mcpClient?.close().catch(() => undefined)
    },
  })

  return new Response(stream, {
    headers: {
      "cache-control": "no-cache, no-transform",
      "content-type": "text/plain; charset=utf-8",
    },
  })
}
