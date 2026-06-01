"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  type ExercisePickerItem,
  type ExerciseTaxonomyItem,
  type ExerciseTaxonomySelection,
  type UserExercise,
} from "./types"
import { getTaxonomyColorDotClass } from "./taxonomy-colors"
import { toFormValues, toPayload } from "./utils"

function getOptimisticTaxonomyId(
  kind: "type",
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
  kind: "type"
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
  qualities: UserExercise["qualities"]
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
    qualities: values.qualities.map((value) => {
      const existingQuality =
        (value.id
          ? qualities.find((quality) => quality.id === value.id) ??
            exercise.qualities.find((quality) => quality.id === value.id)
          : undefined) ??
        qualities.find(
          (quality) => quality.name.toLowerCase() === value.name.toLowerCase()
        ) ??
        exercise.qualities.find(
          (quality) => quality.name.toLowerCase() === value.name.toLowerCase()
        )

      if (existingQuality) {
        return existingQuality
      }

      return {
        id: value.id ?? `optimistic:quality:${value.name.toLowerCase()}`,
        user_id: exercise.user_id,
        name: value.name,
        description: null,
        body_region_id: null,
        display_color: value.display_color ?? null,
        sort_key: null,
        created_at: timestamp,
        updated_at: timestamp,
      }
    }),
    updated_at: timestamp,
  }
}

type TaxonomyFilterDropdownProps = {
  label: string
  emptyLabel: string
  options: ExercisePickerItem[]
  selectedIds: string[]
  onSelectedIdsChange: (selectedIds: string[]) => void
}

function TaxonomyFilterDropdown({
  label,
  emptyLabel,
  options,
  selectedIds,
  onSelectedIdsChange,
}: TaxonomyFilterDropdownProps) {
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const selectedCount = selectedIds.length

  function toggleOption(optionId: string) {
    if (selectedIdSet.has(optionId)) {
      onSelectedIdsChange(selectedIds.filter((id) => id !== optionId))
      return
    }

    onSelectedIdsChange([...selectedIds, optionId])
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant={selectedCount ? "secondary" : "outline"}
            className="h-9 w-36 justify-between gap-2"
            disabled={options.length === 0}
          />
        }
      >
        <span>{label}</span>
        {selectedCount ? (
          <Badge variant="outline" className="h-4 px-1.5">
            {selectedCount}
          </Badge>
        ) : null}
        <ChevronDownIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {options.length ? (
          options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.id}
              checked={selectedIdSet.has(option.id)}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={() => toggleOption(option.id)}
            >
              <span
                className={`size-2 rounded-full border border-border ${getTaxonomyColorDotClass(option.display_color)}`}
                aria-hidden="true"
              />
              <span className="truncate">{option.name}</span>
            </DropdownMenuCheckboxItem>
          ))
        ) : (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {emptyLabel}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ExerciseLibrary() {
  const isMobile = useIsMobile()
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([])
  const [selectedQualityIds, setSelectedQualityIds] = useState<string[]>([])

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
    qualities,
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
  } = useUserExercises({
    pageSize: 10,
    searchQuery: debouncedSearchQuery,
    typeIds: selectedTypeIds,
    qualityIds: selectedQualityIds,
  })

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
  const hasActiveTaxonomyFilters =
    selectedTypeIds.length > 0 || selectedQualityIds.length > 0

  const tableEmptyState = useMemo(() => {
    if (exercises.length === 0) {
      if (hasActiveSearch && hasActiveTaxonomyFilters) {
        return `No exercises match "${debouncedSearchQuery}" with the selected filters.`
      }
      if (hasActiveSearch) {
        return `No exercises match "${debouncedSearchQuery}".`
      }
      if (hasActiveTaxonomyFilters) {
        return "No exercises match the selected filters."
      }
      return "No exercises yet. Add your first exercise to start your library."
    }
    return null
  }, [
    debouncedSearchQuery,
    exercises.length,
    hasActiveSearch,
    hasActiveTaxonomyFilters,
  ])

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
            qualities
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
    kind: "type",
    item: ExercisePickerItem,
    values: { name: string; display_color: string | null }
  ) {
    const result = await updateExerciseTaxonomyItem({
      kind,
      itemId: item.id,
      name: values.name,
      description: "description" in item ? item.description : null,
      display_color: values.display_color,
    })

    if (!result.error) {
      setFormValues((current) => ({
        ...current,
        types: current.types.map((value) =>
          value.id === item.id ? { ...value, ...values } : value
        ),
      }))
    }

    return result
  }

  async function handleUpdateExerciseTaxonomy(
    exercise: UserExercise,
    kind: "types" | "qualities",
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
      toOptimisticExercise(exercise, nextValues, exerciseTypes, qualities)
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

  function handleSelectedTypeIdsChange(nextTypeIds: string[]) {
    setSelectedTypeIds(nextTypeIds)
    setPage(1)
  }

  function handleSelectedQualityIdsChange(nextQualityIds: string[]) {
    setSelectedQualityIds(nextQualityIds)
    setPage(1)
  }

  function clearTaxonomyFilters() {
    setSelectedTypeIds([])
    setSelectedQualityIds([])
    setPage(1)
  }

  return (
    <div className="flex min-h-0 flex-col gap-4 md:h-full md:flex-1 md:gap-2">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => handleSearchInputChange(event.target.value)}
            placeholder="Search by name or description"
            className="h-9 pr-10 pl-9"
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
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <TaxonomyFilterDropdown
            label="Types"
            emptyLabel="No exercise types"
            options={exerciseTypes}
            selectedIds={selectedTypeIds}
            onSelectedIdsChange={handleSelectedTypeIdsChange}
          />
          <TaxonomyFilterDropdown
            label="Qualities"
            emptyLabel="No qualities"
            options={qualities}
            selectedIds={selectedQualityIds}
            onSelectedIdsChange={handleSelectedQualityIdsChange}
          />
          {hasActiveTaxonomyFilters ? (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="px-0"
              onClick={clearTaxonomyFilters}
            >
              Clear filters
            </Button>
          ) : null}
          <Button
            className="size-9 rounded-full shadow-lg"
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
        qualities={qualities}
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
        qualities={qualities}
        onOpenChange={setIsSheetOpen}
        onFieldChange={handleFieldChange}
        onUpdateTaxonomyItem={handleUpdateTaxonomyItem}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
