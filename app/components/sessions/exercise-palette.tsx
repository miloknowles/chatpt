"use client"

import type { DragEvent } from "react"
import { GroupIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import type { UserExercise } from "./types"

type ExercisePaletteProps = {
  exercises: UserExercise[]
  searchQuery: string
  isLoading: boolean
  isSupersetMutating: boolean
  error: string | null
  onSearchChange: (value: string) => void
  onAddSuperset: () => void
  onExerciseDragStart: (
    event: DragEvent<HTMLElement>,
    exerciseName: string
  ) => void
}

export function ExercisePalette({
  exercises,
  searchQuery,
  isLoading,
  isSupersetMutating,
  error,
  onSearchChange,
  onAddSuperset,
  onExerciseDragStart,
}: ExercisePaletteProps) {
  return (
    <aside className="space-y-3 border-b border-border/60 pb-4 lg:border-r lg:border-b-0 lg:pr-4 lg:pb-0">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start"
        disabled={isSupersetMutating}
        onClick={onAddSuperset}
      >
        <GroupIcon />
        Add Superset
      </Button>
      <Input
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search exercises"
      />
      <div className="space-y-1">
        {isLoading ? (
          <div className="px-2 py-2 text-sm text-muted-foreground">
            Searching...
          </div>
        ) : exercises.length === 0 ? (
          <div className="px-2 py-2 text-sm text-muted-foreground">
            No exercises found
          </div>
        ) : (
          exercises.map((exercise) => (
            <div
              key={exercise.id}
              draggable
              onDragStart={(event) => onExerciseDragStart(event, exercise.name)}
              className="cursor-grab rounded-md border border-border/60 bg-background px-3 py-2 text-sm shadow-xs active:cursor-grabbing"
            >
              <div className="truncate font-medium">{exercise.name}</div>
              {exercise.notes ? (
                <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {exercise.notes}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </aside>
  )
}
