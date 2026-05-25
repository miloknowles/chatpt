"use client"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

import { ExerciseActionsMenu } from "./exercise-actions-menu"
import { ExerciseMedia } from "./exercise-media"
import type { UserExercise } from "./types"

type ExerciseLibraryMobileListProps = {
  exercises: UserExercise[]
  isLoading: boolean
  emptyState: string | null
  isSubmitting: boolean
  onEdit: (exercise: UserExercise) => void
  onDelete: (exercise: UserExercise) => void
}

export function ExerciseLibraryMobileList({
  exercises,
  isLoading,
  emptyState,
  isSubmitting,
  onEdit,
  onDelete,
}: ExerciseLibraryMobileListProps) {
  return (
    <div className="space-y-3 md:hidden">
      {isLoading ? (
        Array.from({ length: 3 }).map((_, index) => (
          <article
            key={`mobile-skeleton-${index}`}
            className="space-y-3 rounded-md border border-border/60 p-4"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3 w-10" />
            </div>
            <div className="flex items-end justify-between gap-2 pt-1">
              <div className="flex gap-1">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </article>
        ))
      ) : emptyState ? (
        <div className="rounded-md border border-border/60 px-4 py-6 text-sm text-muted-foreground">
          {emptyState}
        </div>
      ) : (
        exercises.map((exercise) => (
          <article
            key={exercise.id}
            className="space-y-3 rounded-md border border-border/60 p-4"
          >
            <div>
              <h3 className="font-medium text-foreground">{exercise.name}</h3>
              {exercise.notes ? (
                <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                  {exercise.notes}
                </p>
              ) : null}
            </div>

            <ExerciseMedia
              exerciseName={exercise.name}
              imageUrl={exercise.image_url}
              videoUrl={exercise.video_url}
            />

            <div className="flex items-end justify-between gap-2 pt-1">
              <div className="flex flex-wrap gap-1">
                {exercise.tags?.length ? (
                  exercise.tags.map((tag) => (
                    <Badge key={`${exercise.id}-${tag}`} variant="outline">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No tags</span>
                )}
              </div>
              <ExerciseActionsMenu
                exercise={exercise}
                disabled={isSubmitting}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          </article>
        ))
      )}
    </div>
  )
}
