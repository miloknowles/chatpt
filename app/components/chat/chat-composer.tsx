"use client"

import { useEffect, useRef } from "react"
import { ArrowUpIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type ChatComposerProps = {
  isAside: boolean
  value: string
  isSaving: boolean
  onChange: (value: string) => void
  onSubmit: () => void
}

export function ChatComposer({
  isAside,
  value,
  isSaving,
  onChange,
  onSubmit,
}: ChatComposerProps) {
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
