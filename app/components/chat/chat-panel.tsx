"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import { useUserConversations } from "@/hooks/use-user-conversations"
import { useUserMessages } from "@/hooks/use-user-messages"
import { cn } from "@/lib/utils"

import { ChatComposer } from "./chat-composer"
import { ChatHeader } from "./chat-header"
import { ChatMessageBubble } from "./chat-message-bubble"

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
  const [localConversationId, setLocalConversationId] = useState<string | null>(null)
  const [draftMessage, setDraftMessage] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const {
    conversations,
    isLoading: isLoadingConversations,
    isMutating: isMutatingConversation,
    error: conversationError,
    mutationError: conversationMutationError,
    createConversation,
    touchConversation,
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
    isMutating: isSavingMessage,
    error: messageError,
    mutationError: messageMutationError,
    createMessage,
  } = useUserMessages({ conversationId: selectedConversation?.id ?? null })
  const latestSurfaceError =
    messageMutationError ??
    messageError ??
    conversationMutationError ??
    conversationError

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

    if (!trimmedMessage || isSavingMessage || !selectedConversation) {
      return
    }

    const result = await createMessage(trimmedMessage)

    if (result.message) {
      setDraftMessage("")
      await touchConversation(selectedConversation.id, trimmedMessage)
    }
  }

  useEffect(() => {
    const scrollArea = scrollAreaRef.current

    if (!scrollArea) {
      return
    }

    scrollArea.scrollTop = scrollArea.scrollHeight
  }, [messages])

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
        ) : messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message) => (
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
        isSaving={isSavingMessage || !selectedConversation}
        onChange={setDraftMessage}
        onSubmit={() => void sendMessage()}
      />
    </section>
  )
}
