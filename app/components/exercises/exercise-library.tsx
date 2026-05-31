"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  PlusIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useIsMobile } from "@/hooks/use-mobile"
import { useUserExercises } from "@/hooks/use-user-exercises"

import { AddPhotoDialog } from "./add-photo-dialog"
import { AddVideoLinkDialog } from "./add-video-link-dialog"
import { DeleteExerciseDialog } from "./delete-exercise-dialog"
import { ExerciseFormSheet } from "./exercise-form-sheet"
import { ExerciseLibraryMobileList } from "./exercise-library-mobile-list"
import { ExerciseLibraryTable } from "./exercise-library-table"
import {
  EMPTY_FORM_VALUES,
  type ExerciseFormValues,
  type ExerciseTaxonomyItem,
  type ExerciseTaxonomySelection,
  type UserExercise,
} from "./types"
import { toFormValues, toPayload } from "./utils"

function getOptimisticTaxonomyId(
  kind: "type" | "body_region",
  name: string
) {
  return `optimistic:${kind}:${name.trim().toLowerCase()}`
}

function toOptimisticTaxonomyRows<Row extends ExerciseTaxonomyItem>({
  kind,
  values,
  options,
  currentRows,
  userId,
  timestamp,
}: {
  kind: "type" | "body_region"
  values: ExerciseTaxonomySelection[]
  options: Row[]
  currentRows: Row[]
  userId: string
  timestamp: string
}) {
  return values.map((value) => {
    const existingRow =
      (value.id
        ? options.find((option) => option.id === value.id) ??
          currentRows.find((row) => row.id === value.id)
        : undefined) ??
      options.find(
        (option) => option.name.toLowerCase() === value.name.toLowerCase()
      ) ??
      currentRows.find(
        (row) => row.name.toLowerCase() === value.name.toLowerCase()
      )

    if (existingRow) {
      return {
        ...existingRow,
        name: value.name,
        display_color: value.display_color ?? existingRow.display_color,
      }
    }

    return {
      id: value.id ?? getOptimisticTaxonomyId(kind, value.name),
      user_id: userId,
      name: value.name,
      description: null,
      display_color: value.display_color ?? null,
      sort_key: `optimistic:${timestamp}:${value.name}`,
      is_system: false,
      created_at: timestamp,
      updated_at: timestamp,
    } as Row
  })
}

function toOptimisticExercise(
  exercise: UserExercise,
  values: ExerciseFormValues,
  exerciseTypes: UserExercise["types"],
  bodyRegions: UserExercise["body_regions"]
): UserExercise {
  const timestamp = new Date().toISOString()

  return {
    ...exercise,
    name: values.name.trim(),
    notes: values.notes.trim() || null,
    image_url: values.imageUrl.trim() || null,
    video_url: values.videoUrl.trim() || null,
    performance: values.performanceText.trim()
      ? {
          type: "custom",
          text: values.performanceText.trim(),
        }
      : null,
    types: toOptimisticTaxonomyRows({
      kind: "type",
      values: values.types,
      options: exerciseTypes,
      currentRows: exercise.types,
      userId: exercise.user_id,
      timestamp,
    }),
    body_regions: toOptimisticTaxonomyRows({
      kind: "body_region",
      values: values.bodyRegions,
      options: bodyRegions,
      currentRows: exercise.body_regions,
      userId: exercise.user_id,
      timestamp,
    }),
    updated_at: timestamp,
  }
}

export function ExerciseLibrary() {
  const isMobile = useIsMobile()
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchInput.trim())
    }, 300)

    return () => {
      window.clearTimeout(timer)
    }
  }, [searchInput])

  const {
    exercises,
    exerciseTypes,
    bodyRegions,
    page,
    totalPages,
    isLoading,
    isMutating,
    error,
    mutationError,
    setPage,
    createExercise,
    updateExercise,
    updateExerciseImageUrl,
    updateExerciseVideoUrl,
    updateExerciseTaxonomyItem,
    deleteExercise,
  } = useUserExercises({ pageSize: 10, searchQuery: debouncedSearchQuery })

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<UserExercise | null>(null)
  const [exercisePendingDelete, setExercisePendingDelete] =
    useState<UserExercise | null>(null)
  const [exercisePendingVideoLink, setExercisePendingVideoLink] =
    useState<UserExercise | null>(null)
  const [exercisePendingPhoto, setExercisePendingPhoto] =
    useState<UserExercise | null>(null)
  const [videoLinkValue, setVideoLinkValue] = useState("")
  const [videoLinkError, setVideoLinkError] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<ExerciseFormValues>(EMPTY_FORM_VALUES)
  const [formError, setFormError] = useState<string | null>(null)

  const isEditing = Boolean(editingExercise)
  const isSubmitting = isMutating
  const hasActiveSearch = debouncedSearchQuery.length > 0

  const tableEmptyState = useMemo(() => {
    if (exercises.length === 0) {
      if (hasActiveSearch) {
        return `No exercises match "${debouncedSearchQuery}".`
      }
      return "No exercises yet. Add your first exercise to start your library."
    }
    return null
  }, [debouncedSearchQuery, exercises.length, hasActiveSearch])

  function openCreateSheet() {
    setEditingExercise(null)
    setFormValues(EMPTY_FORM_VALUES)
    setFormError(null)
    setIsSheetOpen(true)
  }

  function openEditSheet(exercise: UserExercise) {
    setEditingExercise(exercise)
    setFormValues(toFormValues(exercise))
    setFormError(null)
    setIsSheetOpen(true)
  }

  function handleFieldChange<K extends keyof ExerciseFormValues>(
    field: K,
    value: ExerciseFormValues[K]
  ) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const parsed = toPayload(formValues)
    if ("error" in parsed) {
      setFormError(parsed.error ?? "Unexpected error.")
      return
    }

    const result = editingExercise
      ? await updateExercise(
          editingExercise.id,
          parsed.payload,
          toOptimisticExercise(
            editingExercise,
            formValues,
            exerciseTypes,
            bodyRegions
          )
        )
      : await createExercise(parsed.payload)

    if (result.error) {
      setFormError(result.error)
      return
    }

    setIsSheetOpen(false)
  }

  async function handleUpdateTaxonomyItem(
    kind: "type" | "body_region",
    item: ExerciseTaxonomyItem,
    values: { name: string; display_color: string | null }
  ) {
    const result = await updateExerciseTaxonomyItem({
      kind,
      itemId: item.id,
      name: values.name,
      description: item.description,
      display_color: values.display_color,
    })

    if (!result.error) {
      setFormValues((current) => ({
        ...current,
        types:
          kind === "type"
            ? current.types.map((value) =>
                value.id === item.id ? { ...value, ...values } : value
              )
            : current.types,
        bodyRegions:
          kind === "body_region"
            ? current.bodyRegions.map((value) =>
                value.id === item.id ? { ...value, ...values } : value
              )
            : current.bodyRegions,
      }))
    }

    return result
  }

  async function handleUpdateExerciseTaxonomy(
    exercise: UserExercise,
    kind: "types" | "bodyRegions",
    values: ExerciseTaxonomySelection[]
  ) {
    const nextValues = {
      ...toFormValues(exercise),
      [kind]: values,
    }
    const parsed = toPayload(nextValues)
    if ("error" in parsed) {
      return
    }

    await updateExercise(
      exercise.id,
      parsed.payload,
      toOptimisticExercise(exercise, nextValues, exerciseTypes, bodyRegions)
    )
  }

  function openDeleteDialog(exercise: UserExercise) {
    setExercisePendingDelete(exercise)
  }

  function openAddVideoDialog(exercise: UserExercise) {
    setExercisePendingVideoLink(exercise)
    setVideoLinkValue("")
    setVideoLinkError(null)
  }

  function openAddPhotoDialog(exercise: UserExercise) {
    setExercisePendingPhoto(exercise)
  }

  function handleAddPhotoDialogOpenChange(open: boolean) {
    if (!open) {
      setExercisePendingPhoto(null)
    }
  }

  function handleAddVideoDialogOpenChange(open: boolean) {
    if (!open) {
      setExercisePendingVideoLink(null)
      setVideoLinkValue("")
      setVideoLinkError(null)
    }
  }

  function handleDeleteDialogOpenChange(open: boolean) {
    if (!open) {
      setExercisePendingDelete(null)
    }
  }

  async function handleDelete() {
    if (!exercisePendingDelete) {
      return
    }

    const result = await deleteExercise(exercisePendingDelete.id)
    if (!result.error) {
      setExercisePendingDelete(null)
    }
  }

  async function handleAddVideoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setVideoLinkError(null)

    if (!exercisePendingVideoLink) {
      return
    }

    const nextVideoLink = videoLinkValue.trim()
    if (!nextVideoLink) {
      setVideoLinkError("Video link is required.")
      return
    }

    const result = await updateExerciseVideoUrl(
      exercisePendingVideoLink.id,
      nextVideoLink
    )

    if (result.error) {
      setVideoLinkError(result.error)
      return
    }

    handleAddVideoDialogOpenChange(false)
  }

  async function handleSaveImageUrl(imageUrl: string) {
    if (!exercisePendingPhoto) {
      return { error: "Select an exercise first." }
    }

    return updateExerciseImageUrl(exercisePendingPhoto.id, imageUrl)
  }

  function handleSearchInputChange(value: string) {
    setSearchInput(value)
    setPage(1)
  }

  return (
    <div className="flex min-h-0 flex-col gap-4 md:h-full md:flex-1 md:gap-2">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Input
            value={searchInput}
            onChange={(event) => handleSearchInputChange(event.target.value)}
            placeholder="Search by name or description"
            className="h-9 pr-10"
          />
          {searchInput ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-1 right-1"
              onClick={() => handleSearchInputChange("")}
              aria-label="Clear search"
            >
              <XIcon />
            </Button>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            className="h-10 w-10 rounded-full shadow-lg"
            onClick={openCreateSheet}
            aria-label="Create Exercise"
          >
            <PlusIcon />
          </Button>
        </div>
      </div>

      <ExerciseLibraryMobileList
        exercises={exercises}
        isLoading={isLoading}
        emptyState={tableEmptyState}
        isSubmitting={isSubmitting}
        onEdit={openEditSheet}
        onDelete={openDeleteDialog}
      />

      <ExerciseLibraryTable
        exercises={exercises}
        exerciseTypes={exerciseTypes}
        bodyRegions={bodyRegions}
        isLoading={isLoading}
        emptyState={tableEmptyState}
        isSubmitting={isSubmitting}
        onEdit={openEditSheet}
        onDelete={openDeleteDialog}
        onAddPhoto={openAddPhotoDialog}
        onAddVideo={openAddVideoDialog}
        onUpdateTaxonomyItem={handleUpdateTaxonomyItem}
        onUpdateExerciseTaxonomy={handleUpdateExerciseTaxonomy}
      />

      <div className="flex min-h-6 items-center justify-end">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage(1)}
            aria-label="Go to first page"
            title="First page"
          >
            <ChevronsLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage(page - 1)}
            aria-label="Go to previous page"
            title="Previous page"
          >
            <ChevronLeftIcon />
          </Button>
          <p className="px-1.5 text-xs leading-none text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage(page + 1)}
            aria-label="Go to next page"
            title="Next page"
          >
            <ChevronRightIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage(totalPages)}
            aria-label="Go to last page"
            title="Last page"
          >
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {mutationError ? <p className="text-sm text-destructive">{mutationError}</p> : null}

      <DeleteExerciseDialog
        exercise={exercisePendingDelete}
        isSubmitting={isSubmitting}
        onOpenChange={handleDeleteDialogOpenChange}
        onDelete={() => void handleDelete()}
      />

      <AddVideoLinkDialog
        exercise={exercisePendingVideoLink}
        videoUrl={videoLinkValue}
        error={videoLinkError}
        isSubmitting={isSubmitting}
        onOpenChange={handleAddVideoDialogOpenChange}
        onVideoUrlChange={setVideoLinkValue}
        onSubmit={(event) => void handleAddVideoSubmit(event)}
      />

      <AddPhotoDialog
        exercise={exercisePendingPhoto}
        isSubmitting={isSubmitting}
        onOpenChange={handleAddPhotoDialogOpenChange}
        onSaveImageUrl={handleSaveImageUrl}
      />

      <ExerciseFormSheet
        open={isSheetOpen}
        isMobile={isMobile}
        isEditing={isEditing}
        isSubmitting={isSubmitting}
        formValues={formValues}
        formError={formError}
        exerciseTypes={exerciseTypes}
        bodyRegions={bodyRegions}
        onOpenChange={setIsSheetOpen}
        onFieldChange={handleFieldChange}
        onUpdateTaxonomyItem={handleUpdateTaxonomyItem}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
