"use client"

import type { FormEvent } from "react"
import { XIcon } from "lucide-react"

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

import { TaxonomyMultiSelect } from "./tag-multi-select"
import type {
  ExerciseFormValues,
  ExercisePickerItem,
  ExerciseQualityItem,
  ExerciseTaxonomyItem,
} from "./types"
import { getVideoThumbnailUrl } from "./utils"

/* eslint-disable @next/next/no-img-element -- Exercise media uses user-provided external URLs that are not known at build time. */

type ExerciseFormSheetProps = {
  open: boolean
  isMobile: boolean
  isEditing: boolean
  isSubmitting: boolean
  formValues: ExerciseFormValues
  formError: string | null
  exerciseTypes: ExerciseTaxonomyItem[]
  qualities: ExerciseQualityItem[]
  onOpenChange: (open: boolean) => void
  onFieldChange: <K extends keyof ExerciseFormValues>(
    field: K,
    value: ExerciseFormValues[K]
  ) => void
  onUpdateTaxonomyItem: (
    kind: "type",
    item: ExercisePickerItem,
    values: { name: string; display_color: string | null }
  ) => Promise<{ error?: string }>
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ExerciseFormSheet({
  open,
  isMobile,
  isEditing,
  isSubmitting,
  formValues,
  formError,
  exerciseTypes,
  qualities,
  onOpenChange,
  onFieldChange,
  onUpdateTaxonomyItem,
  onSubmit,
}: ExerciseFormSheetProps) {
  const videoThumbnailUrl = formValues.videoUrl
    ? getVideoThumbnailUrl(formValues.videoUrl)
    : null

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
              <div className="relative">
                <Input
                  id="exercise-image-url"
                  type="url"
                  value={formValues.imageUrl}
                  onChange={(event) =>
                    onFieldChange("imageUrl", event.target.value)
                  }
                  placeholder="https://..."
                  className="pr-10"
                />
                {formValues.imageUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-0.5 right-0.5"
                    onClick={() => onFieldChange("imageUrl", "")}
                    aria-label="Clear image URL"
                  >
                    <XIcon />
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exercise-video-url">Video URL</Label>
              <div className="relative">
                <Input
                  id="exercise-video-url"
                  type="url"
                  value={formValues.videoUrl}
                  onChange={(event) =>
                    onFieldChange("videoUrl", event.target.value)
                  }
                  placeholder="https://..."
                  className="pr-10"
                />
                {formValues.videoUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-0.5 right-0.5"
                    onClick={() => onFieldChange("videoUrl", "")}
                    aria-label="Clear video URL"
                  >
                    <XIcon />
                  </Button>
                ) : null}
              </div>
              {videoThumbnailUrl ? (
                <a
                  href={formValues.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-fit overflow-hidden rounded-md border border-border/60"
                >
                  <img
                    src={videoThumbnailUrl}
                    alt="Exercise video preview"
                    className="h-32 w-56 object-cover"
                    loading="lazy"
                  />
                </a>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Exercise Type(s)</Label>
              <TaxonomyMultiSelect
                label="Exercise Types"
                createLabel="Create type"
                emptyLabel="Select exercise types"
                options={exerciseTypes}
                values={formValues.types}
                onChange={(nextTypes) => onFieldChange("types", nextTypes)}
                onUpdateItem={(item, values) =>
                  onUpdateTaxonomyItem("type", item, values)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Trained Qualities</Label>
              <TaxonomyMultiSelect
                label="Trained Qualities"
                createLabel="Create quality"
                emptyLabel="Select trained qualities"
                options={qualities}
                values={formValues.qualities}
                onChange={(nextQualities) =>
                  onFieldChange("qualities", nextQualities)
                }
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
