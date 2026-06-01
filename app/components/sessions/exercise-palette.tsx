"use client"

import type { DragEvent } from "react"
import { GroupIcon, SearchIcon } from "lucide-react"

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
    exercise: UserExercise
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
    <aside className="flex min-h-0 flex-col gap-3 border-b border-border/60 pb-4 md:p-4 lg:h-full lg:border-r lg:border-b-0">
      <h2 className="font-heading text-sm font-semibold text-foreground">
        Session Builder
      </h2>
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
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search exercises"
          className="pl-9"
        />
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
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
              onDragStart={(event) => onExerciseDragStart(event, exercise)}
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
