"use client"

import { useMemo } from "react"
import { CheckIcon, ChevronDownIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { UserConversation } from "@/types/database"

import { formatMessageTime } from "./utils"

type ChatHeaderProps = {
  isAside: boolean
  conversations: UserConversation[]
  selectedConversation: UserConversation | null
  isLoading: boolean
  isMutating: boolean
  error: string | null
  mutationError: string | null
  onSelectConversation: (conversationId: string) => void
  onCreateConversation: () => void
}

export function ChatHeader({
  isAside,
  conversations,
  selectedConversation,
  isLoading,
  isMutating,
  error,
  mutationError,
  onSelectConversation,
  onCreateConversation,
}: ChatHeaderProps) {
  const currentTitle =
    selectedConversation?.title ?? (isLoading ? "Loading conversations" : "New conversation")
  const latestError = mutationError ?? error
  const sortedConversations = useMemo(
    () =>
      [...conversations].sort(
        (first, second) =>
          getConversationTimestamp(second) - getConversationTimestamp(first)
      ),
    [conversations]
  )

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 border-b border-border/70",
        isAside ? "px-3 py-2" : "px-4 py-2 sm:px-5"
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              className="h-8 min-w-0 max-w-full justify-start px-2"
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
          {sortedConversations.length > 0 ? (
            sortedConversations.map((conversation) => {
              const isSelected = conversation.id === selectedConversation?.id
              const timestamp = getConversationTimestampLabel(conversation)

              return (
                <DropdownMenuItem
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className="min-w-0 items-start py-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{conversation.title}</span>
                    {timestamp ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {timestamp}
                      </span>
                    ) : null}
                  </span>
                  {isSelected ? <CheckIcon className="mt-0.5 ml-auto" /> : null}
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
        className="h-8 shrink-0"
        disabled={isMutating}
        onClick={onCreateConversation}
      >
        <PlusIcon />
        New chat
      </Button>
    </div>
  )
}

function getConversationTimestamp(conversation: UserConversation) {
  const timestamp =
    conversation.last_message_at ?? conversation.updated_at ?? conversation.created_at

  return new Date(timestamp).getTime()
}

function getConversationTimestampLabel(conversation: UserConversation) {
  const timestamp =
    conversation.last_message_at ?? conversation.updated_at ?? conversation.created_at

  if (!timestamp) {
    return null
  }

  return formatMessageTime(new Date(timestamp))
}
