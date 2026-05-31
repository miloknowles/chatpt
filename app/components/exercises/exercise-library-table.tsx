"use client"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

import { ExerciseActionsMenu } from "./exercise-actions-menu"
import { ExerciseMedia } from "./exercise-media"
import { getTaxonomyColorDotClass } from "./taxonomy-colors"
import type { UserExercise } from "./types"
import { formatDate } from "./utils"

function TaxonomyDot({ color }: { color: string | null }) {
  return (
    <span
      className={`size-2 rounded-full border border-border ${getTaxonomyColorDotClass(color)}`}
      aria-hidden="true"
    />
  )
}

type ExerciseLibraryTableProps = {
  exercises: UserExercise[]
  isLoading: boolean
  emptyState: string | null
  isSubmitting: boolean
  onEdit: (exercise: UserExercise) => void
  onDelete: (exercise: UserExercise) => void
}

export function ExerciseLibraryTable({
  exercises,
  isLoading,
  emptyState,
  isSubmitting,
  onEdit,
  onDelete,
}: ExerciseLibraryTableProps) {
  return (
    <div className="hidden min-h-0 flex-1 overflow-auto rounded-md border border-border/60 md:block">
      <table className="w-full min-w-[760px] table-fixed text-left text-sm">
        <colgroup>
          <col className="w-[20rem]" />
          <col className="w-[11rem]" />
          <col className="w-[11rem]" />
          <col />
          <col className="w-32" />
          <col className="w-24" />
        </colgroup>
        <thead className="sticky top-0 z-10 bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Exercise Type(s)</th>
            <th className="px-4 py-3 font-medium">Body Region(s)</th>
            <th className="px-4 py-3 font-medium">Media</th>
            <th className="px-4 py-3 font-medium">Updated</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <tr key={`desktop-skeleton-${index}`} className="border-t border-border/50">
                <td className="px-4 py-3 align-top">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-60" />
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex gap-1">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex gap-1">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <Skeleton className="h-3 w-24" />
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex justify-end">
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </td>
              </tr>
            ))
          ) : emptyState ? (
            <tr>
              <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                {emptyState}
              </td>
            </tr>
          ) : null}
          {exercises.map((exercise) => (
            <tr key={exercise.id} className="border-t border-border/50">
              <td className="px-4 py-3 align-top">
                <div className="line-clamp-2 font-medium text-foreground">
                  {exercise.name}
                </div>
                {exercise.notes ? (
                  <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {exercise.notes ?? "No notes provided"}
                  </div>
                ) : null}
              </td>
              <td className="px-4 py-3 align-top">
                {exercise.types.length ? (
                  <div className="flex flex-wrap gap-1">
                    {exercise.types.map((type) => (
                      <Badge key={`${exercise.id}-type-${type.id}`} variant="outline">
                        <TaxonomyDot color={type.display_color} />
                        {type.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </td>
              <td className="px-4 py-3 align-top">
                {exercise.body_regions.length ? (
                  <div className="flex flex-wrap gap-1">
                    {exercise.body_regions.map((bodyRegion) => (
                      <Badge
                        key={`${exercise.id}-region-${bodyRegion.id}`}
                        variant="outline"
                      >
                        <TaxonomyDot color={bodyRegion.display_color} />
                        {bodyRegion.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </td>
              <td className="px-4 py-3 align-top text-muted-foreground">
                <ExerciseMedia
                  exerciseName={exercise.name}
                  imageUrl={exercise.image_url}
                  videoUrl={exercise.video_url}
                  emptyLabel="None"
                />
              </td>
              <td className="px-4 py-3 align-top text-muted-foreground">
                {formatDate(exercise.updated_at)}
              </td>
              <td className="px-4 py-3 align-top">
                <div className="flex justify-end">
                  <ExerciseActionsMenu
                    exercise={exercise}
                    disabled={isSubmitting}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
