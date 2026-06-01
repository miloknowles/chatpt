"use client"

import {
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react"
import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing"
import {
  GripVerticalIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"

import { useUserProfile } from "@/hooks/use-user-profile"
import { cn } from "@/lib/utils"
import type { UserQuality } from "@/types/database"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

import {
  getTaxonomyColorDotClass,
  TAXONOMY_COLOR_OPTIONS,
} from "./taxonomy-colors"

type DropPlacement = "before" | "after"
type EditableQualityField = "name" | "description"

type ActiveQualityCell = {
  qualityId: string
  field: EditableQualityField
}

type QualityFormValues = {
  name: string
  displayColor: string | null
  description: string
}

const EMPTY_FORM_VALUES: QualityFormValues = {
  name: "",
  displayColor: null,
  description: "",
}

const CELL_NAME_EDITOR_CLASS =
  "h-auto rounded-none border-0 bg-transparent p-0 font-medium text-foreground shadow-none focus-visible:border-transparent focus-visible:ring-0 md:text-sm dark:bg-transparent"
const CELL_DESCRIPTION_EDITOR_CLASS =
  "h-auto rounded-none border-0 bg-transparent p-0 text-foreground shadow-none focus-visible:border-transparent focus-visible:ring-0 md:text-sm dark:bg-transparent"

function optionalText(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function qualityToFormValues(quality: UserQuality): QualityFormValues {
  return {
    name: quality.name,
    displayColor: quality.display_color,
    description: quality.description ?? "",
  }
}

function isValidSortKey(sortKey: string | null) {
  if (!sortKey) {
    return false
  }

  try {
    generateKeyBetween(sortKey, null)
    return true
  } catch {
    return false
  }
}

function getLastSortKey(qualities: UserQuality[]) {
  for (let index = qualities.length - 1; index >= 0; index -= 1) {
    if (isValidSortKey(qualities[index].sort_key)) {
      return qualities[index].sort_key
    }
  }

  return null
}

function getPreviousSortKey(qualities: UserQuality[], startIndex: number) {
  for (let index = startIndex; index >= 0; index -= 1) {
    if (isValidSortKey(qualities[index].sort_key)) {
      return qualities[index].sort_key
    }
  }

  return null
}

function getNextSortKey(qualities: UserQuality[], startIndex: number) {
  for (let index = startIndex; index < qualities.length; index += 1) {
    if (isValidSortKey(qualities[index].sort_key)) {
      return qualities[index].sort_key
    }
  }

  return null
}

function getDropPlacement(event: DragEvent<HTMLElement>): DropPlacement {
  const bounds = event.currentTarget.getBoundingClientRect()
  const midpoint = bounds.top + bounds.height / 2

  return event.clientY < midpoint ? "before" : "after"
}

function getSortKeyForDrop(
  qualities: UserQuality[],
  draggedQualityId: string,
  targetQualityId: string,
  placement: DropPlacement
) {
  const nextOrder = qualities.filter((quality) => quality.id !== draggedQualityId)
  const targetIndex = nextOrder.findIndex(
    (quality) => quality.id === targetQualityId
  )

  if (targetIndex < 0) {
    return null
  }

  const targetSortKey = isValidSortKey(nextOrder[targetIndex]?.sort_key)
    ? nextOrder[targetIndex].sort_key
    : null
  const previousKey =
    placement === "before"
      ? getPreviousSortKey(nextOrder, targetIndex - 1)
      : targetSortKey ?? getPreviousSortKey(nextOrder, targetIndex - 1)
  const nextKey =
    placement === "before"
      ? targetSortKey ?? getNextSortKey(nextOrder, targetIndex)
      : getNextSortKey(nextOrder, targetIndex + 1)

  try {
    return generateKeyBetween(previousKey, nextKey)
  } catch {
    return null
  }
}

function getQualitiesForDrop(
  qualities: UserQuality[],
  draggedQualityId: string,
  targetQualityId: string,
  placement: DropPlacement
) {
  const draggedQuality = qualities.find(
    (quality) => quality.id === draggedQualityId
  )
  if (!draggedQuality) {
    return null
  }

  const nextOrder = qualities.filter((quality) => quality.id !== draggedQualityId)
  const targetIndex = nextOrder.findIndex(
    (quality) => quality.id === targetQualityId
  )
  if (targetIndex < 0) {
    return null
  }

  nextOrder.splice(
    placement === "before" ? targetIndex : targetIndex + 1,
    0,
    draggedQuality
  )

  return nextOrder
}

function hasUnusableSortKeys(qualities: UserQuality[]) {
  const seenSortKeys = new Set<string>()

  return qualities.some((quality) => {
    const sortKey = quality.sort_key
    if (!sortKey || !isValidSortKey(sortKey)) {
      return true
    }

    if (seenSortKeys.has(sortKey)) {
      return true
    }

    seenSortKeys.add(sortKey)
    return false
  })
}

function TaxonomyColorDot({ color }: { color: string | null }) {
  return (
    <span
      className={cn(
        "size-2.5 shrink-0 rounded-full border border-border",
        getTaxonomyColorDotClass(color)
      )}
      aria-hidden="true"
    />
  )
}

function QualityColorDropdown({
  quality,
  disabled,
  onSelect,
}: {
  quality: UserQuality
  disabled: boolean
  onSelect: (displayColor: string | null) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            className="size-5 shrink-0 cursor-pointer rounded-full p-0"
            aria-label={`Choose color for ${quality.name}`}
            disabled={disabled}
          />
        }
      >
        <TaxonomyColorDot color={quality.display_color} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <div className="grid grid-cols-3 gap-1.5">
          {TAXONOMY_COLOR_OPTIONS.map((option) => (
            <Button
              key={option.label}
              type="button"
              size="xs"
              variant={
                quality.display_color === option.value ? "secondary" : "outline"
              }
              className="justify-start px-1.5 text-[11px]"
              aria-label={`Set ${quality.name} color to ${option.label}`}
              onClick={() => {
                setIsOpen(false)
                onSelect(option.value)
              }}
            >
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full border border-border",
                  option.dotClassName
                )}
                aria-hidden="true"
              />
              {option.label}
            </Button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function QualityActionsMenu({
  quality,
  disabled,
  onEdit,
  onDelete,
}: {
  quality: UserQuality
  disabled: boolean
  onEdit: (quality: UserQuality) => void
  onDelete: (quality: UserQuality) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={`Actions for ${quality.name}`}
            disabled={disabled}
          />
        }
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuItem onClick={() => onEdit(quality)}>
          <PencilIcon />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(quality)}
        >
          <Trash2Icon />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function QualityDesktopSkeletonRows() {
  return Array.from({ length: 4 }).map((_, index) => (
    <tr key={`quality-desktop-skeleton-${index}`} className="border-t border-border/50">
      <td className="px-4 py-3 align-middle">
        <Skeleton className="size-6 rounded-md" />
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-2">
          <Skeleton className="size-2.5 rounded-full" />
          <Skeleton className="h-4 w-44" />
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <Skeleton className="h-4 w-full" />
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex justify-end">
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </td>
    </tr>
  ))
}

function QualityMobileSkeletonCards() {
  return Array.from({ length: 3 }).map((_, index) => (
    <article
      key={`quality-mobile-skeleton-${index}`}
      className="space-y-3 rounded-md border border-border/60 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="size-2.5 rounded-full" />
            <Skeleton className="h-4 w-2/5" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </article>
  ))
}

export function QualityManager() {
  const {
    qualities,
    isLoading,
    isMutating,
    error,
    mutationError,
    createQuality,
    updateQuality,
    reorderQuality,
    deleteQuality,
  } = useUserProfile()
  const sortedQualities = useMemo(() => qualities, [qualities])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingQuality, setEditingQuality] = useState<UserQuality | null>(null)
  const [pendingDeleteQuality, setPendingDeleteQuality] =
    useState<UserQuality | null>(null)
  const [formValues, setFormValues] =
    useState<QualityFormValues>(EMPTY_FORM_VALUES)
  const [activeCell, setActiveCell] = useState<ActiveQualityCell | null>(null)
  const [cellFormValues, setCellFormValues] =
    useState<QualityFormValues>(EMPTY_FORM_VALUES)
  const [formError, setFormError] = useState<string | null>(null)
  const [cellFormError, setCellFormError] = useState<string | null>(null)
  const [draggedQualityId, setDraggedQualityId] = useState<string | null>(null)
  const [dragOverQualityId, setDragOverQualityId] = useState<string | null>(null)
  const [dropPlacement, setDropPlacement] = useState<DropPlacement>("before")
  const shouldSkipNextCellSaveRef = useRef(false)

  function openCreateForm() {
    setEditingQuality(null)
    setFormValues(EMPTY_FORM_VALUES)
    setFormError(null)
    setIsFormOpen(true)
  }

  function openEditForm(quality: UserQuality) {
    setEditingQuality(quality)
    setFormValues(qualityToFormValues(quality))
    setFormError(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditingQuality(null)
    setFormValues(EMPTY_FORM_VALUES)
    setFormError(null)
  }

  function openCellEdit(quality: UserQuality, field: EditableQualityField) {
    setActiveCell({ qualityId: quality.id, field })
    setCellFormValues(qualityToFormValues(quality))
    setCellFormError(null)
  }

  function closeCellEdit() {
    setActiveCell(null)
    setCellFormValues(EMPTY_FORM_VALUES)
    setCellFormError(null)
  }

  function cancelCellEdit() {
    shouldSkipNextCellSaveRef.current = true
    closeCellEdit()
  }

  function isActiveCell(qualityId: string, field: EditableQualityField) {
    return activeCell?.qualityId === qualityId && activeCell.field === field
  }

  async function reindexQualities(qualitiesToIndex: UserQuality[]) {
    const sortKeys = generateNKeysBetween(null, null, qualitiesToIndex.length)
    const results = await Promise.all(
      qualitiesToIndex.map((quality, index) =>
        reorderQuality(quality.id, sortKeys[index])
      )
    )

    return results.find((result) => result.error)?.error ?? null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const name = formValues.name.trim()
    if (!name) {
      setFormError("Name is required.")
      return
    }

    let createSortKey = generateKeyBetween(getLastSortKey(sortedQualities), null)
    if (!editingQuality && hasUnusableSortKeys(sortedQualities)) {
      const sortKeys = generateNKeysBetween(null, null, sortedQualities.length + 1)
      const reindexError = await reindexQualities(sortedQualities)
      if (reindexError) {
        setFormError(reindexError)
        return
      }
      createSortKey = sortKeys[sortedQualities.length]
    }

    const payload = {
      name,
      description: optionalText(formValues.description),
      display_color: formValues.displayColor,
      body_region_id: editingQuality?.body_region_id ?? null,
      sort_key: editingQuality ? editingQuality.sort_key : createSortKey,
    }
    const result = editingQuality
      ? await updateQuality(editingQuality.id, payload)
      : await createQuality(payload)

    if (result.error) {
      setFormError(result.error)
      return
    }

    closeForm()
  }

  async function handleCellSave(quality: UserQuality) {
    if (shouldSkipNextCellSaveRef.current) {
      shouldSkipNextCellSaveRef.current = false
      return
    }

    if (!activeCell || activeCell.qualityId !== quality.id) {
      return
    }

    setCellFormError(null)
    const name = cellFormValues.name.trim()
    if (!name) {
      setCellFormError("Name is required.")
      return
    }

    const description = optionalText(cellFormValues.description)
    const hasChanges =
      name !== quality.name ||
      description !== quality.description ||
      cellFormValues.displayColor !== quality.display_color

    if (!hasChanges) {
      closeCellEdit()
      return
    }

    const result = await updateQuality(quality.id, {
      name,
      description,
      display_color: cellFormValues.displayColor,
      body_region_id: quality.body_region_id,
      sort_key: quality.sort_key,
    })

    if (result.error) {
      setCellFormError(result.error)
      return
    }

    closeCellEdit()
  }

  async function handleColorCellSelect(
    quality: UserQuality,
    displayColor: string | null
  ) {
    setCellFormError(null)

    if (displayColor === quality.display_color) {
      closeCellEdit()
      return
    }

    const result = await updateQuality(quality.id, {
      name: quality.name,
      description: quality.description,
      display_color: displayColor,
      body_region_id: quality.body_region_id,
      sort_key: quality.sort_key,
    })

    if (result.error) {
      setCellFormError(result.error)
      return
    }

    closeCellEdit()
  }

  function handleDragStart(
    event: DragEvent<HTMLButtonElement>,
    qualityId: string
  ) {
    event.stopPropagation()
    setDraggedQualityId(qualityId)
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("application/x-trained-quality", qualityId)
  }

  async function handleDrop(event: DragEvent<HTMLElement>, targetQualityId: string) {
    event.preventDefault()

    const droppedQualityId =
      draggedQualityId ||
      event.dataTransfer.getData("application/x-trained-quality")

    if (!droppedQualityId || droppedQualityId === targetQualityId) {
      setDraggedQualityId(null)
      setDragOverQualityId(null)
      setDropPlacement("before")
      return
    }

    const placement = getDropPlacement(event)
    const sortKey = getSortKeyForDrop(
      sortedQualities,
      droppedQualityId,
      targetQualityId,
      placement
    )

    if (sortKey && !hasUnusableSortKeys(sortedQualities)) {
      await reorderQuality(droppedQualityId, sortKey)
    } else {
      const nextOrder = getQualitiesForDrop(
        sortedQualities,
        droppedQualityId,
        targetQualityId,
        placement
      )
      if (nextOrder) {
        await reindexQualities(nextOrder)
      }
    }

    setDraggedQualityId(null)
    setDragOverQualityId(null)
    setDropPlacement("before")
  }

  async function handleDeleteQuality() {
    if (!pendingDeleteQuality) {
      return
    }

    const result = await deleteQuality(pendingDeleteQuality.id)
    if (!result.error) {
      setPendingDeleteQuality(null)
    }
  }

  async function handleColorSelect(
    quality: UserQuality,
    displayColor: string | null
  ) {
    if (displayColor === quality.display_color) {
      return
    }

    const result = await updateQuality(quality.id, {
      name: quality.name,
      description: quality.description,
      display_color: displayColor,
      body_region_id: quality.body_region_id,
      sort_key: quality.sort_key,
    })

    if (result.error) {
      setFormError(result.error)
    }
  }

  function renderQualityRow(quality: UserQuality) {
    const isDragOver = dragOverQualityId === quality.id
    const isEditingQuality = activeCell?.qualityId === quality.id
    const isEditingName = isActiveCell(quality.id, "name")
    const isEditingDescription = isActiveCell(quality.id, "description")

    return (
      <tr
        key={quality.id}
        className={cn(
          "border-t border-border/50",
          isDragOver &&
            dropPlacement === "before" &&
            "border-t-2 border-t-primary",
          isDragOver &&
            dropPlacement === "after" &&
            "border-b-2 border-b-primary"
        )}
        onDragOver={(event) => {
          event.preventDefault()
          setDragOverQualityId(quality.id)
          setDropPlacement(getDropPlacement(event))
        }}
        onDragLeave={() => setDragOverQualityId(null)}
        onDrop={(event) => {
          void handleDrop(event, quality.id)
        }}
      >
        <td className="px-4 py-3 align-middle">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            draggable={!isEditingQuality}
            disabled={isEditingQuality}
            aria-label={`Drag ${quality.name}`}
            onDragStart={(event) => handleDragStart(event, quality.id)}
            onDragEnd={() => {
              setDraggedQualityId(null)
              setDragOverQualityId(null)
            }}
          >
            <GripVerticalIcon />
          </Button>
        </td>
        <td
          className="cursor-text px-4 py-3 align-middle"
          onDoubleClick={() => openCellEdit(quality, "name")}
        >
          <div className="space-y-1">
            {isEditingName ? (
              <div className="flex min-w-0 items-center gap-2">
                <QualityColorDropdown
                  quality={quality}
                  disabled={isMutating}
                  onSelect={(displayColor) => {
                    void handleColorCellSelect(quality, displayColor)
                  }}
                />
                <Input
                  autoFocus
                  className={CELL_NAME_EDITOR_CLASS}
                  value={cellFormValues.name}
                  maxLength={120}
                  aria-label={`Name for ${quality.name}`}
                  onBlur={() => {
                    void handleCellSave(quality)
                  }}
                  onChange={(event) =>
                    setCellFormValues((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.preventDefault()
                      cancelCellEdit()
                    }
                    if (event.key === "Enter") {
                      event.preventDefault()
                      event.currentTarget.blur()
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex min-w-0 items-center gap-2">
                <QualityColorDropdown
                  quality={quality}
                  disabled={isMutating}
                  onSelect={(displayColor) => {
                    void handleColorSelect(quality, displayColor)
                  }}
                />
                <div className="line-clamp-2 cursor-text font-medium text-foreground">
                  {quality.name}
                </div>
              </div>
            )}
            {isEditingName && cellFormError ? (
              <p className="text-xs text-destructive">{cellFormError}</p>
            ) : null}
          </div>
        </td>
        <td
          className="cursor-text px-4 py-3 align-middle"
          onDoubleClick={() => openCellEdit(quality, "description")}
        >
          <div className="space-y-1">
            {isEditingDescription ? (
              <Input
                autoFocus
                value={cellFormValues.description}
                aria-label={`Description for ${quality.name}`}
                className={CELL_DESCRIPTION_EDITOR_CLASS}
                onBlur={() => {
                  void handleCellSave(quality)
                }}
                onChange={(event) =>
                  setCellFormValues((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault()
                    cancelCellEdit()
                  }
                  if (event.key === "Enter") {
                    event.preventDefault()
                    event.currentTarget.blur()
                  }
                }}
              />
            ) : (
              <div className="line-clamp-1 cursor-text text-muted-foreground">
                {quality.description ?? "No description"}
              </div>
            )}
            {isEditingDescription && cellFormError ? (
              <p className="text-xs text-destructive">{cellFormError}</p>
            ) : null}
          </div>
        </td>
        <td className="px-4 py-3 align-top">
          <div className="flex justify-end gap-1">
            <QualityActionsMenu
              quality={quality}
              disabled={isMutating}
              onEdit={openEditForm}
              onDelete={setPendingDeleteQuality}
            />
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="font-heading text-xl font-medium sm:text-xl">
            Trained Qualities
          </h1>
          <p className="max-w-3xl text-xs text-muted-foreground">
            Capabilities you are building, maintaining, or keeping visible for exercise assignment.
          </p>
        </div>
        <Button
          type="button"
          className="size-9 rounded-full shadow-lg"
          onClick={openCreateForm}
          aria-label="Add trained quality"
        >
          <PlusIcon />
        </Button>
      </div>

      {error || mutationError ? (
        <p className="text-sm text-destructive">{error ?? mutationError}</p>
      ) : null}

      <div className="hidden min-h-0 flex-1 overflow-auto rounded-md border border-border/60 md:block">
        <table className="w-full min-w-[680px] table-fixed text-left text-sm">
          <colgroup>
            <col className="w-12" />
            <col className="w-[18rem]" />
            <col />
            <col className="w-24" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium" />
              <th className="px-4 py-3 font-medium">Quality</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <QualityDesktopSkeletonRows />
            ) : sortedQualities.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={4}>
                  No trained qualities yet. Add your first quality to assign it to exercises.
                </td>
              </tr>
            ) : null}
            {sortedQualities.map(renderQualityRow)}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <QualityMobileSkeletonCards />
        ) : sortedQualities.length === 0 ? (
          <div className="rounded-md border border-border/60 px-4 py-6 text-sm text-muted-foreground">
            No trained qualities yet. Add your first quality to assign it to exercises.
          </div>
        ) : (
          sortedQualities.map((quality) => {
            const isDragOver = dragOverQualityId === quality.id
            const isEditingQuality = activeCell?.qualityId === quality.id
            const isEditingName = isActiveCell(quality.id, "name")
            const isEditingDescription = isActiveCell(
              quality.id,
              "description"
            )
            return (
              <article
                key={quality.id}
                className={cn(
                  "space-y-3 rounded-md border border-border/60 p-4",
                  isDragOver &&
                    dropPlacement === "before" &&
                    "border-t-2 border-t-primary",
                  isDragOver &&
                    dropPlacement === "after" &&
                    "border-b-2 border-b-primary"
                )}
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragOverQualityId(quality.id)
                  setDropPlacement(getDropPlacement(event))
                }}
                onDragLeave={() => setDragOverQualityId(null)}
                onDrop={(event) => {
                  void handleDrop(event, quality.id)
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="space-y-1">
                      {isEditingName ? (
                        <div className="flex min-w-0 items-center gap-2">
                          <QualityColorDropdown
                            quality={quality}
                            disabled={isMutating}
                            onSelect={(displayColor) => {
                              void handleColorCellSelect(quality, displayColor)
                            }}
                          />
                          <Input
                            autoFocus
                            className={CELL_NAME_EDITOR_CLASS}
                            value={cellFormValues.name}
                            maxLength={120}
                            aria-label={`Name for ${quality.name}`}
                            onBlur={() => {
                              void handleCellSave(quality)
                            }}
                            onChange={(event) =>
                              setCellFormValues((current) => ({
                                ...current,
                                name: event.target.value,
                              }))
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Escape") {
                                event.preventDefault()
                                cancelCellEdit()
                              }
                              if (event.key === "Enter") {
                                event.preventDefault()
                                event.currentTarget.blur()
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex min-w-0 items-center gap-2">
                          <QualityColorDropdown
                            quality={quality}
                            disabled={isMutating}
                            onSelect={(displayColor) => {
                              void handleColorSelect(quality, displayColor)
                            }}
                          />
                          <h3
                            className="line-clamp-2 cursor-text font-medium text-foreground"
                            onClick={() => openCellEdit(quality, "name")}
                          >
                            {quality.name}
                          </h3>
                        </div>
                      )}
                      {isEditingName && cellFormError ? (
                        <p className="text-xs text-destructive">
                          {cellFormError}
                        </p>
                      ) : null}
                    </div>
                    {isEditingDescription ? (
                      <div className="space-y-1">
                        <Input
                          autoFocus
                          value={cellFormValues.description}
                          aria-label={`Description for ${quality.name}`}
                          className={CELL_DESCRIPTION_EDITOR_CLASS}
                          onBlur={() => {
                            void handleCellSave(quality)
                          }}
                          onChange={(event) =>
                            setCellFormValues((current) => ({
                              ...current,
                              description: event.target.value,
                            }))
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Escape") {
                              event.preventDefault()
                              cancelCellEdit()
                            }
                            if (event.key === "Enter") {
                              event.preventDefault()
                              event.currentTarget.blur()
                            }
                          }}
                        />
                        {cellFormError ? (
                          <p className="text-xs text-destructive">
                            {cellFormError}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p
                        className="line-clamp-2 cursor-text text-sm text-muted-foreground"
                        onClick={() => openCellEdit(quality, "description")}
                      >
                        {quality.description ?? "No description"}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      draggable={!isEditingQuality}
                      disabled={isEditingQuality}
                      aria-label={`Drag ${quality.name}`}
                      onDragStart={(event) =>
                        handleDragStart(event, quality.id)
                      }
                      onDragEnd={() => {
                        setDraggedQualityId(null)
                        setDragOverQualityId(null)
                      }}
                    >
                      <GripVerticalIcon />
                    </Button>
                    <QualityActionsMenu
                      quality={quality}
                      disabled={isMutating}
                      onEdit={openEditForm}
                      onDelete={setPendingDeleteQuality}
                    />
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeForm()
          }
        }}
      >
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {editingQuality ? "Edit Trained Quality" : "Add Trained Quality"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="quality-name">Name</Label>
              <Input
                id="quality-name"
                value={formValues.name}
                maxLength={120}
                required
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {TAXONOMY_COLOR_OPTIONS.map((option) => (
                  <Button
                    key={option.label}
                    type="button"
                    variant={
                      formValues.displayColor === option.value
                        ? "secondary"
                        : "outline"
                    }
                    className="justify-start"
                    onClick={() =>
                      setFormValues((current) => ({
                        ...current,
                        displayColor: option.value,
                      }))
                    }
                  >
                    <span
                      className={cn(
                        "size-3 rounded-full border border-border",
                        option.dotClassName
                      )}
                      aria-hidden="true"
                    />
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quality-description">Description</Label>
              <Textarea
                id="quality-description"
                value={formValues.description}
                className="min-h-24"
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={isMutating}>
                {isMutating ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(pendingDeleteQuality)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteQuality(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete trained quality?</AlertDialogTitle>
            <AlertDialogDescription>
              {`This will delete "${pendingDeleteQuality?.name ?? "this quality"}" and remove it from assigned exercises. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMutating}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isMutating}
              onClick={() => {
                void handleDeleteQuality()
              }}
            >
              {isMutating ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
