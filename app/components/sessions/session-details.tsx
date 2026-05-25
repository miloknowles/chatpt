"use client"

import { Loader2Icon, SaveIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

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
  return (
    <>
      <div className="flex items-center gap-2">
        <Input
          value={draftName}
          onChange={(event) => onDraftNameChange(event.target.value)}
          onBlur={(event) => onSaveName(event.target.value)}
          placeholder="Session name"
          className="h-12 rounded-md border-border px-3 text-md font-semibold shadow-xs focus-visible:ring-2 md:text-xl"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-12"
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
      <Textarea
        value={draftNotes}
        onChange={(event) => onDraftNotesChange(event.target.value)}
        onBlur={(event) => onSaveNotes(event.target.value)}
        placeholder="Session description"
        className="min-h-32 resize-y"
      />
      <p className="text-xs text-muted-foreground">
        Last updated {formatDate(session.updated_at)}
      </p>
    </>
  )
}
