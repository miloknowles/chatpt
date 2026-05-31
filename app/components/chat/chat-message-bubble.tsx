import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"
import type { UserMessage } from "@/types/database"

import { formatMessageTime } from "./utils"

type ChatMessageBubbleProps = {
  message: UserMessage
}

function StreamingText({ content }: { content: string }) {
  return content.split(/(\s+)/).map((part, index) => {
    if (!part) {
      return null
    }

    if (/^\s+$/.test(part)) {
      return <span key={`space-${index}`}>{part}</span>
    }

    return (
      <span
        key={`word-${index}-${part}`}
        className="inline-block animate-chat-word-in"
      >
        {part}
      </span>
    )
  })
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a({ children, href }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              {children}
            </a>
          )
        },
        code({ children, className }) {
          const isBlock = className?.startsWith("language-")

          if (isBlock) {
            return (
              <code className={cn("block overflow-x-auto rounded bg-background/70 p-2 text-xs", className)}>
                {children}
              </code>
            )
          }

          return (
            <code className="rounded bg-background/70 px-1 py-0.5 text-[0.85em]">
              {children}
            </code>
          )
        },
        ol({ children }) {
          return <ol className="list-decimal space-y-1 pl-5">{children}</ol>
        },
        ul({ children }) {
          return <ul className="list-disc space-y-1 pl-5">{children}</ul>
        },
        p({ children }) {
          return <p>{children}</p>
        },
        pre({ children }) {
          return <pre className="my-2 overflow-x-auto">{children}</pre>
        },
        table({ children }) {
          return (
            <div className="my-2 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-xs">
                {children}
              </table>
            </div>
          )
        },
        td({ children }) {
          return <td className="border border-border px-2 py-1">{children}</td>
        },
        th({ children }) {
          return (
            <th className="border border-border bg-background/60 px-2 py-1 font-medium">
              {children}
            </th>
          )
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user"
  const isFailed = message.status === "failed"
  const isStreamingAssistant = !isUser && message.status === "streaming"
  const content = message.content
  const createdAt = new Date(message.created_at)

  return (
    <article className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "space-y-1",
          isUser
            ? "max-w-[85%] items-end text-right"
            : "w-full items-start text-left"
        )}
      >
        {isStreamingAssistant ? (
          <div className="text-xs text-muted-foreground">
            {content ? "Writing..." : "Thinking..."}
          </div>
        ) : null}
        {content && isUser ? (
          <div
            className="rounded-2xl bg-primary px-3 py-2 text-sm leading-5 text-primary-foreground shadow-xs"
          >
            <div className="space-y-2">
              <MarkdownContent content={content} />
            </div>
          </div>
        ) : null}
        {content && !isUser ? (
          <div
            className={cn(
              "text-sm leading-5",
              isFailed ? "text-destructive" : "text-foreground"
            )}
          >
            <div className="space-y-2">
              {isStreamingAssistant ? (
                <StreamingText content={content} />
              ) : (
                <MarkdownContent content={content} />
              )}
            </div>
          </div>
        ) : null}
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
