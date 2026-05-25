"use client"

import type { FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"

import { TagMultiSelect } from "./tag-multi-select"
import type { ExerciseFormValues } from "./types"

type ExerciseFormSheetProps = {
  open: boolean
  isMobile: boolean
  isEditing: boolean
  isSubmitting: boolean
  formValues: ExerciseFormValues
  formError: string | null
  availableTags: string[]
  onOpenChange: (open: boolean) => void
  onFieldChange: <K extends keyof ExerciseFormValues>(
    field: K,
    value: ExerciseFormValues[K]
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ExerciseFormSheet({
  open,
  isMobile,
  isEditing,
  isSubmitting,
  formValues,
  formError,
  availableTags,
  onOpenChange,
  onFieldChange,
  onSubmit,
}: ExerciseFormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={isMobile ? "h-[85dvh] rounded-t-xl" : "w-full sm:max-w-2xl"}
      >
        <form className="flex h-full flex-col" onSubmit={onSubmit}>
          <SheetHeader>
            <SheetTitle>
              {isEditing ? "Edit Exercise" : "Create Exercise"}
            </SheetTitle>
            <SheetDescription>Add a new exercise to your library</SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="exercise-name">Name</Label>
              <Input
                id="exercise-name"
                value={formValues.name}
                onChange={(event) => onFieldChange("name", event.target.value)}
                maxLength={120}
                required
                placeholder="Heel-elevated split squat"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exercise-notes">Notes</Label>
              <Textarea
                id="exercise-notes"
                value={formValues.notes}
                onChange={(event) => onFieldChange("notes", event.target.value)}
                placeholder="Add cues and notes for yourself"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exercise-image-url">Image URL</Label>
              <Input
                id="exercise-image-url"
                type="url"
                value={formValues.imageUrl}
                onChange={(event) => onFieldChange("imageUrl", event.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exercise-video-url">Video URL</Label>
              <Input
                id="exercise-video-url"
                type="url"
                value={formValues.videoUrl}
                onChange={(event) => onFieldChange("videoUrl", event.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <TagMultiSelect
                options={availableTags}
                values={formValues.tags}
                onChange={(nextTags) => onFieldChange("tags", nextTags)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exercise-default-set">Suggested Program</Label>
              <Textarea
                id="exercise-suggested-program"
                value={formValues.performanceText}
                onChange={(event) =>
                  onFieldChange("performanceText", event.target.value)
                }
                placeholder="Sets, reps, weight, duration"
                className="min-h-24"
              />
            </div>
          </div>

          <SheetFooter>
            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEditing
                  ? "Saving..."
                  : "Adding..."
                : isEditing
                  ? "Save Exercise"
                  : "Create"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
