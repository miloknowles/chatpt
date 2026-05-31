"use client"

import type { DragEvent } from "react"

import { SupersetCard } from "./superset-card"
import type {
  SupersetDropHandler,
  UserLoggedExercise,
  UserSuperset,
} from "./types"

type SupersetListProps = {
  supersets: UserSuperset[]
  isLoading: boolean
  isMutating: boolean
  draggedSupersetId: string | null
  dragOverSupersetId: string | null
  loggedExercisesBySupersetId: Record<string, UserLoggedExercise[]>
  draftSupersetNames: Record<string, string>
  onSupersetDragStart: (
    event: DragEvent<HTMLElement>,
    supersetId: string
  ) => void
  onSupersetDragEnd: () => void
  onSupersetDragOver: (
    event: DragEvent<HTMLElement>,
    supersetId: string
  ) => void
  onSupersetDragLeave: () => void
  onSupersetDrop: SupersetDropHandler
  onDraftSupersetNameChange: (supersetId: string, value: string) => void
  onSaveSupersetName: (supersetId: string, previousName: string | null) => void
  onDeleteSuperset: (supersetId: string) => Promise<boolean>
}

function getSupersetLabel(index: number) {
  let value = index + 1
  let label = ""

  while (value > 0) {
    value -= 1
    label = String.fromCharCode(65 + (value % 26)) + label
    value = Math.floor(value / 26)
  }

  return label
}

export function SupersetList({
  supersets,
  isLoading,
  isMutating,
  draggedSupersetId,
  dragOverSupersetId,
  loggedExercisesBySupersetId,
  draftSupersetNames,
  onSupersetDragStart,
  onSupersetDragEnd,
  onSupersetDragOver,
  onSupersetDragLeave,
  onSupersetDrop,
  onDraftSupersetNameChange,
  onSaveSupersetName,
  onDeleteSuperset,
}: SupersetListProps) {
  return (
    <div className="space-y-3 pt-2">
      {isLoading ? (
        <div className="rounded-md border border-border/60 bg-background px-4 py-6 text-sm text-muted-foreground">
          Loading supersets...
        </div>
      ) : supersets.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/70 bg-background px-4 py-8 text-center text-sm text-muted-foreground">
          Add a superset to start building this session.
        </div>
      ) : (
        supersets.map((superset, index) => (
          <SupersetCard
            key={superset.id}
            superset={superset}
            label={getSupersetLabel(index)}
            loggedExercises={loggedExercisesBySupersetId[superset.id] ?? []}
            draftName={
              draftSupersetNames[superset.id] ??
              superset.name ??
              "Untitled Superset"
            }
            isDragging={draggedSupersetId === superset.id}
            isDragTarget={dragOverSupersetId === superset.id}
            isMutating={isMutating}
            onDragStart={onSupersetDragStart}
            onDragEnd={onSupersetDragEnd}
            onDragOver={onSupersetDragOver}
            onDragLeave={onSupersetDragLeave}
            onDrop={onSupersetDrop}
            onDraftNameChange={onDraftSupersetNameChange}
            onSaveName={onSaveSupersetName}
            onDelete={onDeleteSuperset}
          />
        ))
      )}
    </div>
  )
}
