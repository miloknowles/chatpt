"use client"

import { useState } from "react"
import { Loader2Icon, SaveIcon } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import type { UserSession } from "./types"
import { formatDate } from "./utils"

type SessionDetailsProps = {
  session: UserSession
  draftName: string
  draftNotes: string
  isSavingDraft: boolean
  isMutating: boolean
  onDraftNameChange: (value: string) => void
  onDraftNotesChange: (value: string) => void
  onSaveName: (value: string) => void
  onSaveNotes: (value: string) => void
  onSaveDraft: () => void
}

type DescriptionMode = "plaintext" | "rendered"

function MarkdownPreview({ content }: { content: string }) {
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
              className="text-primary underline underline-offset-2"
            >
              {children}
            </a>
          )
        },
        code({ children, className }) {
          const isBlock = className?.startsWith("language-")

          if (isBlock) {
            return (
              <code
                className={cn(
                  "block overflow-x-auto rounded bg-muted p-2 text-xs",
                  className
                )}
              >
                {children}
              </code>
            )
          }

          return (
            <code className="rounded bg-muted px-1 py-0.5 text-[0.85em]">
              {children}
            </code>
          )
        },
        h1({ children }) {
          return <h1 className="text-xl font-semibold">{children}</h1>
        },
        h2({ children }) {
          return <h2 className="text-lg font-semibold">{children}</h2>
        },
        h3({ children }) {
          return <h3 className="text-base font-semibold">{children}</h3>
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
            <th className="border border-border bg-muted px-2 py-1 font-medium">
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

export function SessionDetails({
  session,
  draftName,
  draftNotes,
  isSavingDraft,
  isMutating,
  onDraftNameChange,
  onDraftNotesChange,
  onSaveName,
  onSaveNotes,
  onSaveDraft,
}: SessionDetailsProps) {
  const [descriptionMode, setDescriptionMode] =
    useState<DescriptionMode>("plaintext")
  const hasDescription = draftNotes.trim().length > 0

  return (
    <>
      <div className="flex items-center gap-2">
        <Input
          value={draftName}
          onChange={(event) => onDraftNameChange(event.target.value)}
          onBlur={(event) => onSaveName(event.target.value)}
          placeholder="Session name"
          className="h-10 rounded-md border-border px-3 text-base font-semibold shadow-xs focus-visible:ring-2 md:text-lg"
        />
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          aria-label="Save session"
          disabled={isSavingDraft || isMutating}
          onClick={onSaveDraft}
        >
          {isSavingDraft || isMutating ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <SaveIcon />
          )}
        </Button>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">Description</p>
          <div className="inline-flex rounded-md border border-border bg-background p-0.5 shadow-xs">
            <Button
              type="button"
              variant={descriptionMode === "plaintext" ? "secondary" : "ghost"}
              size="sm"
              aria-pressed={descriptionMode === "plaintext"}
              onClick={() => setDescriptionMode("plaintext")}
              className="h-7 px-2 text-xs"
            >
              Edit
            </Button>
            <Button
              type="button"
              variant={descriptionMode === "rendered" ? "secondary" : "ghost"}
              size="sm"
              aria-pressed={descriptionMode === "rendered"}
              onClick={() => setDescriptionMode("rendered")}
              className="h-7 px-2 text-xs"
            >
              Preview
            </Button>
          </div>
        </div>
        {descriptionMode === "plaintext" ? (
          <Textarea
            value={draftNotes}
            onChange={(event) => onDraftNotesChange(event.target.value)}
            onBlur={(event) => onSaveNotes(event.target.value)}
            placeholder="Session description"
            className="min-h-32 resize-y"
          />
        ) : (
          <div className="min-h-32 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs">
            {hasDescription ? (
              <div className="space-y-2 leading-6">
                <MarkdownPreview content={draftNotes} />
              </div>
            ) : (
              <p className="text-muted-foreground">No description yet.</p>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Last updated {formatDate(session.updated_at)}
      </p>
    </>
  )
}
