"use client"

import { ImagePlusIcon, VideoIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { ExerciseActionsMenu } from "./exercise-actions-menu"
import { ExerciseMedia } from "./exercise-media"
import { TaxonomyDropdown } from "./tag-multi-select"
import { getTaxonomyColorDotClass } from "./taxonomy-colors"
import type {
  ExerciseTaxonomyItem,
  ExerciseTaxonomySelection,
  ExerciseQualityItem,
  ExercisePickerItem,
  UserExercise,
} from "./types"
import { formatDate } from "./utils"

function TaxonomyDot({ color }: { color: string | null }) {
  return (
    <span
      className={`size-2 shrink-0 rounded-full border border-border ${getTaxonomyColorDotClass(color)}`}
      aria-hidden="true"
    />
  )
}

function TaxonomyBadge({
  color,
  name,
}: {
  color: string | null
  name: string
}) {
  return (
    <Badge variant="outline" className="max-w-full min-w-0">
      <TaxonomyDot color={color} />
      <span className="min-w-0 truncate">{name}</span>
    </Badge>
  )
}

type ExerciseLibraryTableProps = {
  exercises: UserExercise[]
  exerciseTypes: ExerciseTaxonomyItem[]
  qualities: ExerciseQualityItem[]
  isLoading: boolean
  emptyState: string | null
  isSubmitting: boolean
  onEdit: (exercise: UserExercise) => void
  onDelete: (exercise: UserExercise) => void
  onAddPhoto: (exercise: UserExercise) => void
  onAddVideo: (exercise: UserExercise) => void
  onUpdateTaxonomyItem: (
    kind: "type",
    item: ExercisePickerItem,
    values: { name: string; display_color: string | null }
  ) => Promise<{ error?: string }>
  onUpdateExerciseTaxonomy: (
    exercise: UserExercise,
    kind: "types" | "qualities",
    values: ExerciseTaxonomySelection[]
  ) => Promise<void>
}

export function ExerciseLibraryTable({
  exercises,
  exerciseTypes,
  qualities,
  isLoading,
  emptyState,
  isSubmitting,
  onEdit,
  onDelete,
  onAddPhoto,
  onAddVideo,
  onUpdateTaxonomyItem,
  onUpdateExerciseTaxonomy,
}: ExerciseLibraryTableProps) {
  return (
    <div className="hidden min-h-0 flex-1 overflow-auto rounded-md border border-border/60 md:block">
      <table className="w-full min-w-[900px] table-fixed text-left text-sm">
        <colgroup>
          <col className="w-[20rem]" />
          <col className="w-[14rem]" />
          <col className="w-[14rem]" />
          <col />
          <col className="w-32" />
          <col className="w-24" />
        </colgroup>
        <thead className="sticky top-0 z-10 bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Exercise Type(s)</th>
            <th className="px-4 py-3 font-medium">Trained Qualities</th>
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
                <TaxonomyDropdown
                  label="Exercise Types"
                  createLabel="Create type"
                  options={exerciseTypes}
                  values={exercise.types.map((type) => ({
                    id: type.id,
                    name: type.name,
                    display_color: type.display_color,
                  }))}
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto min-h-8 w-full min-w-0 justify-start whitespace-normal px-1.5 py-1 text-left"
                      disabled={isSubmitting}
                      aria-label={`Edit exercise types for ${exercise.name}`}
                    />
                  }
                  triggerChildren={
                    exercise.types.length ? (
                      <div className="flex min-w-0 flex-wrap gap-1">
                        {exercise.types.map((type) => (
                          <TaxonomyBadge
                            key={`${exercise.id}-type-${type.id}`}
                            color={type.display_color}
                            name={type.name}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )
                  }
                  onChange={(nextTypes) =>
                    onUpdateExerciseTaxonomy(exercise, "types", nextTypes)
                  }
                  onUpdateItem={(item, values) =>
                    onUpdateTaxonomyItem("type", item, values)
                  }
                />
              </td>
              <td className="px-4 py-3 align-top">
                <TaxonomyDropdown
                  label="Trained Qualities"
                  createLabel="Create quality"
                  options={qualities}
                  values={exercise.qualities.map((quality) => ({
                    id: quality.id,
                    name: quality.name,
                    display_color: quality.display_color,
                  }))}
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto min-h-8 w-full min-w-0 justify-start whitespace-normal px-1.5 py-1 text-left"
                      disabled={isSubmitting}
                      aria-label={`Edit trained qualities for ${exercise.name}`}
                    />
                  }
                  triggerChildren={
                    exercise.qualities.length ? (
                      <div className="flex min-w-0 flex-wrap gap-1">
                        {exercise.qualities.map((quality) => (
                          <TaxonomyBadge
                            key={`${exercise.id}-quality-${quality.id}`}
                            color={quality.display_color}
                            name={quality.name}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )
                  }
                  onChange={(nextQualities) =>
                    onUpdateExerciseTaxonomy(
                      exercise,
                      "qualities",
                      nextQualities
                    )
                  }
                />
              </td>
              <td className="px-4 py-3 align-top text-muted-foreground">
                <div className="flex flex-wrap items-start gap-3">
                  <ExerciseMedia
                    exerciseName={exercise.name}
                    imageUrl={exercise.image_url}
                    videoUrl={exercise.video_url}
                    emptyLabel={exercise.video_url ? "None" : undefined}
                    className="flex flex-wrap items-start gap-3 space-y-0"
                  />
                  <div className="flex flex-wrap gap-2">
                    {!exercise.image_url ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-xs"
                        disabled={isSubmitting}
                        onClick={() => onAddPhoto(exercise)}
                        aria-label={`Add photo for ${exercise.name}`}
                        title="Add photo"
                      >
                        <ImagePlusIcon />
                      </Button>
                    ) : null}
                    {!exercise.video_url ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-xs"
                        disabled={isSubmitting}
                        onClick={() => onAddVideo(exercise)}
                        aria-label={`Add video link for ${exercise.name}`}
                        title="Add video link"
                      >
                        <VideoIcon />
                      </Button>
                    ) : null}
                  </div>
                </div>
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
