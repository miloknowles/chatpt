import { cn } from "@/lib/utils"
import type { UserMessage } from "@/types/database"

import { formatMessageTime } from "./utils"

type ChatMessageBubbleProps = {
  message: UserMessage
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
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
