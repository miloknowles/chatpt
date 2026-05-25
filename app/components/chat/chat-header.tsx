"use client"

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
