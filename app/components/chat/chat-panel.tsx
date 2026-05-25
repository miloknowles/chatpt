"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowUpIcon,
  CheckIcon,
  ChevronDownIcon,
  PlusIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { useUserConversations } from "@/hooks/use-user-conversations"
import { useUserMessages } from "@/hooks/use-user-messages"
import { cn } from "@/lib/utils"
import type { UserConversation, UserMessage } from "@/types/database"

type ChatPanelProps = {
  variant?: "page" | "aside"
  recentConversationLimit?: number
}

function formatMessageTime(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function ChatMessageBubble({ message }: { message: UserMessage }) {
  const isUser = message.role === "user"
  const createdAt = new Date(message.created_at)

  return (
    <article className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] space-y-1",
          isUser ? "items-end text-right" : "items-start text-left"
        )}
      >
        <div
          className={cn(
            "rounded-md px-3 py-2 text-sm leading-6 shadow-xs",
            isUser
              ? "bg-primary text-primary-foreground"
              : "border border-border/70 bg-muted/60 text-foreground"
          )}
        >
          {message.content}
        </div>
        <time
          dateTime={createdAt.toISOString()}
          suppressHydrationWarning
          className="block text-[11px] text-muted-foreground"
        >
          {formatMessageTime(createdAt)}
        </time>
      </div>
    </article>
  )
}

function ChatComposer({
  isAside,
  value,
  isSaving,
  onChange,
  onSubmit,
}: {
  isAside: boolean
  value: string
  isSaving: boolean
  onChange: (value: string) => void
  onSubmit: () => void
}) {
  const canSubmit = value.trim().length > 0 && !isSaving
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    textarea.style.height = "auto"
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [value])

  return (
    <form
      className={cn(
        "flex shrink-0 flex-col gap-2 border-t border-border/70 bg-background",
        isAside ? "p-4" : "p-4 sm:p-5"
      )}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.shiftKey) {
            return
          }

          event.preventDefault()

          if (canSubmit) {
            onSubmit()
          }
        }}
        aria-label="Chat message"
        placeholder="Ask questions or modify your program"
        rows={2}
        className="min-h-10 resize-none overflow-hidden"
      />
      <div className="flex w-full justify-end">
        <Button
          type="submit"
          size="icon"
          className="rounded-full"
          disabled={!canSubmit}
          aria-label="Send message"
          title="Send message"
        >
          <ArrowUpIcon />
        </Button>
      </div>
    </form>
  )
}

function ChatHeader({
  isAside,
  conversations,
  selectedConversation,
  isLoading,
  isMutating,
  error,
  mutationError,
  onSelectConversation,
  onCreateConversation,
}: {
  isAside: boolean
  conversations: UserConversation[]
  selectedConversation: UserConversation | null
  isLoading: boolean
  isMutating: boolean
  error: string | null
  mutationError: string | null
  onSelectConversation: (conversationId: string) => void
  onCreateConversation: () => void
}) {
  const currentTitle =
    selectedConversation?.title ?? (isLoading ? "Loading conversations" : "New conversation")
  const latestError = mutationError ?? error

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 border-b border-border/70",
        isAside ? "px-4 py-3" : "px-4 py-3 sm:px-5"
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              className="min-w-0 max-w-full justify-start px-2"
              disabled={isLoading && conversations.length === 0}
            />
          }
        >
          <span className="truncate font-heading text-sm font-semibold">
            {currentTitle}
          </span>
          <ChevronDownIcon className="ml-1 size-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          {conversations.length > 0 ? (
            conversations.map((conversation) => {
              const isSelected = conversation.id === selectedConversation?.id

              return (
                <DropdownMenuItem
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className="min-w-0"
                >
                  <span className="truncate">{conversation.title}</span>
                  {isSelected ? <CheckIcon className="ml-auto" /> : null}
                </DropdownMenuItem>
              )
            })
          ) : (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              {isLoading ? "Loading conversations" : "No conversations yet"}
            </div>
          )}
          {latestError ? (
            <div className="px-2 py-1.5 text-sm text-destructive">
              {latestError}
            </div>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        disabled={isMutating}
        onClick={onCreateConversation}
      >
        <PlusIcon />
        New chat
      </Button>
    </div>
  )
}

export function ChatPanel({
  variant = "page",
  recentConversationLimit = 10,
}: ChatPanelProps) {
  const isAside = variant === "aside"
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isChatRoute = pathname === "/training/chat"
  const conversationParam = searchParams.get("conversation")
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
  const urlConversation = useMemo(
    () =>
      conversationParam
        ? conversations.find((conversation) => conversation.id === conversationParam) ??
        null
        : null,
    [conversationParam, conversations]
  )
  const localConversation = useMemo(
    () =>
      localConversationId
        ? conversations.find((conversation) => conversation.id === localConversationId) ??
        null
        : null,
    [conversations, localConversationId]
  )
  const selectedConversation =
    (isChatRoute ? urlConversation : localConversation) ?? conversations[0] ?? null
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

  const getConversationUrl = useCallback(
    (conversationId: string) => {
      const nextParams = new URLSearchParams(searchParams.toString())
      nextParams.set("conversation", conversationId)
      return `${pathname}?${nextParams.toString()}`
    },
    [pathname, searchParams]
  )

  function selectConversation(conversationId: string) {
    setLocalConversationId(conversationId)

    if (isChatRoute) {
      router.replace(getConversationUrl(conversationId), { scroll: false })
    }
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
    if (conversations.length === 0) {
      return
    }

    if (isChatRoute) {
      const nextConversationId = urlConversation?.id ?? conversations[0].id

      if (conversationParam !== nextConversationId) {
        router.replace(getConversationUrl(nextConversationId), { scroll: false })
      }

      return
    }
  }, [
    conversationParam,
    conversations,
    getConversationUrl,
    isChatRoute,
    router,
    urlConversation,
  ])

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
