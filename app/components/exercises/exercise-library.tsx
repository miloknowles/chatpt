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

import { DeleteExerciseDialog } from "./delete-exercise-dialog"
import { ExerciseFormSheet } from "./exercise-form-sheet"
import { ExerciseLibraryMobileList } from "./exercise-library-mobile-list"
import { ExerciseLibraryTable } from "./exercise-library-table"
import {
  EMPTY_FORM_VALUES,
  type ExerciseFormValues,
  type UserExercise,
} from "./types"
import { toFormValues, toPayload } from "./utils"

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
    availableTags,
    page,
    totalPages,
    isLoading,
    isMutating,
    error,
    mutationError,
    setPage,
    createExercise,
    updateExercise,
    deleteExercise,
  } = useUserExercises({ pageSize: 10, searchQuery: debouncedSearchQuery })

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<UserExercise | null>(null)
  const [exercisePendingDelete, setExercisePendingDelete] =
    useState<UserExercise | null>(null)
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
      ? await updateExercise(editingExercise.id, parsed.payload)
      : await createExercise(parsed.payload)

    if (result.error) {
      setFormError(result.error)
      return
    }

    setIsSheetOpen(false)
  }

  function openDeleteDialog(exercise: UserExercise) {
    setExercisePendingDelete(exercise)
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
        isLoading={isLoading}
        emptyState={tableEmptyState}
        isSubmitting={isSubmitting}
        onEdit={openEditSheet}
        onDelete={openDeleteDialog}
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

      <ExerciseFormSheet
        open={isSheetOpen}
        isMobile={isMobile}
        isEditing={isEditing}
        isSubmitting={isSubmitting}
        formValues={formValues}
        formError={formError}
        availableTags={availableTags}
        onOpenChange={setIsSheetOpen}
        onFieldChange={handleFieldChange}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
