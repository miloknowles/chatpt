"use client"

import type { DragEvent } from "react"

import { SupersetCard } from "./superset-card"
import type { SupersetDropHandler, UserSuperset } from "./types"

type SupersetListProps = {
  supersets: UserSuperset[]
  isLoading: boolean
  draggedSupersetId: string | null
  dragOverSupersetId: string | null
  supersetExerciseNames: Record<string, string[]>
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
}

export function SupersetList({
  supersets,
  isLoading,
  draggedSupersetId,
  dragOverSupersetId,
  supersetExerciseNames,
  draftSupersetNames,
  onSupersetDragStart,
  onSupersetDragEnd,
  onSupersetDragOver,
  onSupersetDragLeave,
  onSupersetDrop,
  onDraftSupersetNameChange,
  onSaveSupersetName,
}: SupersetListProps) {
  return (
    <div className="space-y-3 pt-2">
      {isLoading ? (
        <div className="rounded-md border border-border/60 px-4 py-6 text-sm text-muted-foreground">
          Loading supersets...
        </div>
      ) : supersets.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
          Add a superset to start building this session.
        </div>
      ) : (
        supersets.map((superset) => (
          <SupersetCard
            key={superset.id}
            superset={superset}
            exerciseNames={supersetExerciseNames[superset.id] ?? []}
            draftName={
              draftSupersetNames[superset.id] ??
              superset.name ??
              "Untitled Superset"
            }
            isDragging={draggedSupersetId === superset.id}
            isDragTarget={dragOverSupersetId === superset.id}
            onDragStart={onSupersetDragStart}
            onDragEnd={onSupersetDragEnd}
            onDragOver={onSupersetDragOver}
            onDragLeave={onSupersetDragLeave}
            onDrop={onSupersetDrop}
            onDraftNameChange={onDraftSupersetNameChange}
            onSaveName={onSaveSupersetName}
          />
        ))
      )}
    </div>
  )
}
