"use client"

import type { DragEvent } from "react"
import { GripVerticalIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import type {
  SupersetDropHandler,
  UserLoggedExercise,
  UserSuperset,
} from "./types"

type SupersetCardProps = {
  superset: UserSuperset
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
        "cursor-grab rounded-md border border-border/70 bg-background p-4 shadow-xs transition active:cursor-grabbing",
        isDragging && "opacity-50",
        isDragTarget && "border-primary bg-muted/30"
      )}
    >
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center gap-2">
          <GripVerticalIcon className="size-4 text-muted-foreground" />
          <Badge variant="secondary" className="uppercase text-xs tracking-wider">
            Superset
          </Badge>
        </div>
        <Input
          value={draftName}
          onChange={(event) => onDraftNameChange(superset.id, event.target.value)}
          onBlur={() => onSaveName(superset.id, superset.name)}
          className="h-8 min-w-0 border-border text-center text-sm font-medium uppercase tracker-wider"
          aria-label="Superset name"
        />
        <div className="text-right text-xs font-medium text-muted-foreground">
          {loggedExercises.length}{" "}
          {loggedExercises.length === 1 ? "exercise" : "exercises"}
        </div>
      </header>
      {loggedExercises.length > 0 ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {loggedExercises.map((loggedExercise) => (
            <div
              key={loggedExercise.id}
              className="rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-sm"
            >
              {loggedExercise.exercise_name}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-md border border-dashed border-border/70 px-3 py-4 text-center text-sm text-muted-foreground">
          Drop exercises here
        </div>
      )}
    </article>
  )
}
