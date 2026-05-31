"use client"

import type { DragEvent } from "react"
import { GripVerticalIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import type {
  SupersetDropHandler,
  UserLoggedExercise,
  UserSuperset,
} from "./types"

type SupersetCardProps = {
  superset: UserSuperset
  label: string
  loggedExercises: UserLoggedExercise[]
  draftName: string
  isDragging: boolean
  isDragTarget: boolean
  onDragStart: (event: DragEvent<HTMLElement>, supersetId: string) => void
  onDragEnd: () => void
  onDragOver: (event: DragEvent<HTMLElement>, supersetId: string) => void
  onDragLeave: () => void
  onDrop: SupersetDropHandler
  onDraftNameChange: (supersetId: string, value: string) => void
  onSaveName: (supersetId: string, previousName: string | null) => void
}

export function SupersetCard({
  superset,
  label,
  loggedExercises,
  draftName,
  isDragging,
  isDragTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onDraftNameChange,
  onSaveName,
}: SupersetCardProps) {
  return (
    <article
      draggable
      onDragStart={(event) => onDragStart(event, superset.id)}
      onDragEnd={onDragEnd}
      onDragOver={(event) => onDragOver(event, superset.id)}
      onDragLeave={onDragLeave}
      onDrop={(event) => {
        event.preventDefault()
        onDrop(event, superset.id)
      }}
      className={cn(
        "cursor-grab overflow-hidden rounded-md border border-border/70 bg-background shadow-xs transition active:cursor-grabbing",
        isDragging && "opacity-50",
        isDragTarget && "border-primary bg-muted/30"
      )}
    >
      <header className="flex items-center gap-3 border-b border-border/60 bg-muted/30 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <GripVerticalIcon className="size-4 text-muted-foreground" />
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/40 text-sm font-semibold">
            {label}
          </div>
          <Input
            value={draftName}
            onChange={(event) =>
              onDraftNameChange(superset.id, event.target.value)
            }
            onBlur={() => onSaveName(superset.id, superset.name)}
            className="h-8 max-w-xs min-w-0 border-border text-left text-sm font-medium"
            aria-label="Superset name"
          />
        </div>
        <div className="shrink-0 text-right text-xs font-medium text-muted-foreground">
          {loggedExercises.length}{" "}
          {loggedExercises.length === 1 ? "exercise" : "exercises"}
        </div>
      </header>
      <div className="p-4">
        {loggedExercises.length > 0 ? (
          <div className="grid gap-2">
            {loggedExercises.map((loggedExercise, index) => (
              <div
                key={loggedExercise.id}
                className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-sm"
              >
                <span className="shrink-0 font-medium text-muted-foreground">
                  {label}
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate">
                    {loggedExercise.exercise_name}
                  </span>
                  {loggedExercise.exercise_notes ? (
                    <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">
                      {loggedExercise.exercise_notes}
                    </span>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border/70 px-3 py-4 text-center text-sm text-muted-foreground">
            Drop exercises here
          </div>
        )}
      </div>
    </article>
  )
}
