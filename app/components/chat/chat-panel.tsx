"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import { useUserConversations } from "@/hooks/use-user-conversations"
import { useUserMessages } from "@/hooks/use-user-messages"
import { useAppDispatch } from "@/lib/redux/store"
import { trainingApi } from "@/lib/redux/training-api"
import { cn } from "@/lib/utils"
import type { UserMessage } from "@/types/database"

import { ChatComposer } from "./chat-composer"
import { ChatHeader } from "./chat-header"
import { ChatMessageBubble } from "./chat-message-bubble"

const FAILED_ASSISTANT_MESSAGE = "The request failed, try again later."

type ChatPanelProps = {
  variant?: "page" | "aside"
  recentConversationLimit?: number
  selectedConversationId?: string | null
  onSelectedConversationIdChange?: (conversationId: string) => void
}

export function ChatPanel({
  variant = "page",
  recentConversationLimit = 10,
  selectedConversationId,
  onSelectedConversationIdChange,
}: ChatPanelProps) {
  const isAside = variant === "aside"
  const dispatch = useAppDispatch()
  const [localConversationId, setLocalConversationId] = useState<string | null>(null)
  const [draftMessage, setDraftMessage] = useState("")
  const [turnError, setTurnError] = useState<string | null>(null)
  const [optimisticUserMessage, setOptimisticUserMessage] =
    useState<UserMessage | null>(null)
  const [streamingAssistantMessage, setStreamingAssistantMessage] =
    useState<UserMessage | null>(null)
  const [isSendingTurn, setIsSendingTurn] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const {
    conversations,
    isLoading: isLoadingConversations,
    isMutating: isMutatingConversation,
    error: conversationError,
    mutationError: conversationMutationError,
    createConversation,
  } = useUserConversations({ limit: recentConversationLimit })
  const activeConversationId = selectedConversationId ?? localConversationId
  const localConversation = useMemo(
    () =>
      activeConversationId
        ? conversations.find((conversation) => conversation.id === activeConversationId) ??
        null
        : null,
    [activeConversationId, conversations]
  )
  const selectedConversation = localConversation ?? conversations[0] ?? null
  const {
    messages,
    isLoading: isLoadingMessages,
    error: messageError,
    mutationError: messageMutationError,
  } = useUserMessages({ conversationId: selectedConversation?.id ?? null })
  const latestSurfaceError =
    turnError ??
    messageMutationError ??
    messageError ??
    conversationMutationError ??
    conversationError
  const visibleMessages = useMemo(() => {
    const nextMessages = [...messages]

    if (
      optimisticUserMessage &&
      !messages.some((message) => message.id === optimisticUserMessage.id) &&
      !messages.some(
        (message) =>
          message.role === "user" &&
          message.content === optimisticUserMessage.content &&
          message.created_at >= optimisticUserMessage.created_at
      )
    ) {
      nextMessages.push(optimisticUserMessage)
    }

    if (streamingAssistantMessage) {
      nextMessages.push(streamingAssistantMessage)
    }

    return nextMessages
  }, [messages, optimisticUserMessage, streamingAssistantMessage])

  function selectConversation(conversationId: string) {
    setLocalConversationId(conversationId)
    onSelectedConversationIdChange?.(conversationId)
  }

  async function startNewChat() {
    const result = await createConversation()

    if (result.conversation) {
      selectConversation(result.conversation.id)
    }
  }

  async function sendMessage() {
    const trimmedMessage = draftMessage.trim()

    if (!trimmedMessage || isSendingTurn || !selectedConversation) {
      return
    }

    const submittedAt = new Date().toISOString()

    setDraftMessage("")
    setTurnError(null)
    setIsSendingTurn(true)
    setOptimisticUserMessage(
      createLocalMessage({
        id: `local-user-${crypto.randomUUID()}`,
        conversationId: selectedConversation.id,
        content: trimmedMessage,
        role: "user",
        createdAt: submittedAt,
      })
    )
    setStreamingAssistantMessage(
      createLocalMessage({
        id: `local-assistant-${crypto.randomUUID()}`,
        conversationId: selectedConversation.id,
        content: "",
        role: "assistant",
        status: "streaming",
        createdAt: new Date().toISOString(),
      })
    )

    try {
      const response = await fetch("/api/chat/turn", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: trimmedMessage,
        }),
      })

      if (!response.ok || !response.body) {
        const errorPayload = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(errorPayload?.error ?? "Could not send message.")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ""

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        assistantContent += chunk
        setStreamingAssistantMessage((message) =>
          message ? { ...message, content: assistantContent } : message
        )
      }

      const finalChunk = decoder.decode()
      if (finalChunk) {
        assistantContent += finalChunk
        setStreamingAssistantMessage((message) =>
          message ? { ...message, content: assistantContent } : message
        )
      }

      setStreamingAssistantMessage((message) =>
        message
          ? {
              ...message,
              status:
                assistantContent.trim() === FAILED_ASSISTANT_MESSAGE
                  ? "failed"
                  : "complete",
            }
          : message
      )

      dispatch(
        trainingApi.util.invalidateTags([
          { type: "Messages", id: selectedConversation.id },
          { type: "Messages", id: "LIST" },
          { type: "Conversations", id: "LIST" },
          { type: "Conversations", id: selectedConversation.id },
        ])
      )
      setOptimisticUserMessage(null)
      setStreamingAssistantMessage(null)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not send message."
      setTurnError(message)
      setDraftMessage(trimmedMessage)
      setStreamingAssistantMessage((assistantMessage) =>
        assistantMessage
          ? {
              ...assistantMessage,
              content: assistantMessage.content || message,
              status: "failed",
            }
          : assistantMessage
      )
    } finally {
      setIsSendingTurn(false)
    }
  }

  useEffect(() => {
    const scrollArea = scrollAreaRef.current

    if (!scrollArea) {
      return
    }

    scrollArea.scrollTop = scrollArea.scrollHeight
  }, [visibleMessages])

  return (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden bg-background",
        isAside
          ? "h-full"
          : "h-[calc(100dvh-10rem)] min-h-[28rem] rounded-md border border-border/70"
      )}
      aria-label="Training chat"
    >
      <ChatHeader
        isAside={isAside}
        conversations={conversations}
        selectedConversation={selectedConversation}
        isLoading={isLoadingConversations}
        isMutating={isMutatingConversation}
        error={conversationError}
        mutationError={conversationMutationError}
        onSelectConversation={selectConversation}
        onCreateConversation={() => void startNewChat()}
      />

      <div
        ref={scrollAreaRef}
        className={cn(
          "flex-1 overflow-y-auto",
          isAside ? "px-4 py-4" : "px-4 py-5 sm:px-5"
        )}
      >
        {latestSurfaceError ? (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {latestSurfaceError}
          </div>
        ) : null}
        {isLoadingMessages ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading messages
          </div>
        ) : visibleMessages.length > 0 ? (
          <div className="space-y-4">
            {visibleMessages.map((message) => (
              <ChatMessageBubble key={message.id} message={message} />
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No messages yet
          </div>
        )}
      </div>

      <ChatComposer
        isAside={isAside}
        value={draftMessage}
        isSaving={isSendingTurn || !selectedConversation}
        onChange={setDraftMessage}
        onSubmit={() => void sendMessage()}
      />
    </section>
  )
}

function createLocalMessage({
  id,
  conversationId,
  content,
  role,
  status = "complete",
  createdAt,
}: {
  id: string
  conversationId: string
  content: string
  role: UserMessage["role"]
  status?: UserMessage["status"]
  createdAt: string
}): UserMessage {
  return {
    id,
    user_id: "local",
    conversation_id: conversationId,
    role,
    content,
    status,
    metadata: {},
    created_at: createdAt,
    updated_at: createdAt,
  }
}
