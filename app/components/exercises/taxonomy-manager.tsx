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
  PlusIcon,
  Trash2Icon,
} from "lucide-react"

import { useUserExerciseTaxonomy } from "@/hooks/use-user-exercise-taxonomy"
import { cn } from "@/lib/utils"
import type { UserBodyRegion, UserExerciseType } from "@/types/database"
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

type TaxonomyKind = "type" | "body_region"
type TaxonomyItem = UserExerciseType | UserBodyRegion
type DropPlacement = "before" | "after"
type EditableTaxonomyField = "name" | "description"

type ActiveTaxonomyCell = {
  itemId: string
  field: EditableTaxonomyField
}

type TaxonomyFormValues = {
  name: string
  description: string
  displayColor: string | null
}

type TaxonomyManagerProps = {
  kind: TaxonomyKind
  title: string
  description: string
  emptyLabel: string
}

const EMPTY_FORM_VALUES: TaxonomyFormValues = {
  name: "",
  description: "",
  displayColor: null,
}

const CELL_NAME_EDITOR_CLASS =
  "h-auto rounded-none border-0 bg-transparent p-0 font-medium text-foreground shadow-none focus-visible:border-transparent focus-visible:ring-0 md:text-sm dark:bg-transparent"
const CELL_DESCRIPTION_EDITOR_CLASS =
  "h-auto rounded-none border-0 bg-transparent p-0 text-foreground shadow-none focus-visible:border-transparent focus-visible:ring-0 md:text-sm dark:bg-transparent"

function optionalText(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function itemToFormValues(item: TaxonomyItem): TaxonomyFormValues {
  return {
    name: item.name,
    description: item.description ?? "",
    displayColor: item.display_color,
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

function getLastSortKey(items: TaxonomyItem[]) {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (isValidSortKey(items[index].sort_key)) {
      return items[index].sort_key
    }
  }

  return null
}

function getPreviousSortKey(items: TaxonomyItem[], startIndex: number) {
  for (let index = startIndex; index >= 0; index -= 1) {
    if (isValidSortKey(items[index].sort_key)) {
      return items[index].sort_key
    }
  }

  return null
}

function getNextSortKey(items: TaxonomyItem[], startIndex: number) {
  for (let index = startIndex; index < items.length; index += 1) {
    if (isValidSortKey(items[index].sort_key)) {
      return items[index].sort_key
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
  items: TaxonomyItem[],
  draggedItemId: string,
  targetItemId: string,
  placement: DropPlacement
) {
  const nextOrder = items.filter((item) => item.id !== draggedItemId)
  const targetIndex = nextOrder.findIndex((item) => item.id === targetItemId)

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

function getItemsForDrop(
  items: TaxonomyItem[],
  draggedItemId: string,
  targetItemId: string,
  placement: DropPlacement
) {
  const draggedItem = items.find((item) => item.id === draggedItemId)
  if (!draggedItem) {
    return null
  }

  const nextOrder = items.filter((item) => item.id !== draggedItemId)
  const targetIndex = nextOrder.findIndex((item) => item.id === targetItemId)
  if (targetIndex < 0) {
    return null
  }

  nextOrder.splice(
    placement === "before" ? targetIndex : targetIndex + 1,
    0,
    draggedItem
  )

  return nextOrder
}

function hasUnusableSortKeys(items: TaxonomyItem[]) {
  const seenSortKeys = new Set<string>()

  return items.some((item) => {
    if (!isValidSortKey(item.sort_key)) {
      return true
    }

    if (seenSortKeys.has(item.sort_key)) {
      return true
    }

    seenSortKeys.add(item.sort_key)
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

function TaxonomyActionsMenu({
  item,
  disabled,
  onDelete,
}: {
  item: TaxonomyItem
  disabled: boolean
  onDelete: (item: TaxonomyItem) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={`Actions for ${item.name}`}
            disabled={disabled}
          />
        }
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(item)}>
          <Trash2Icon />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function TaxonomyColorDropdown({
  item,
  onSelect,
}: {
  item: TaxonomyItem
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
            aria-label={`Choose color for ${item.name}`}
          />
        }
      >
        <TaxonomyColorDot color={item.display_color} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <div className="grid grid-cols-3 gap-1.5">
          {TAXONOMY_COLOR_OPTIONS.map((option) => (
            <Button
              key={option.label}
              type="button"
              size="xs"
              variant={
                item.display_color === option.value ? "secondary" : "outline"
              }
              className="justify-start px-1.5 text-[11px]"
              aria-label={`Set ${item.name} color to ${option.label}`}
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

function TaxonomyDesktopSkeletonRows() {
  return Array.from({ length: 4 }).map((_, index) => (
    <tr key={`desktop-skeleton-${index}`} className="border-t border-border/50">
      <td className="px-4 py-3 align-middle">
        <Skeleton className="size-6 rounded-md" />
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-2">
          <Skeleton className="size-2.5 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex justify-end">
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </td>
    </tr>
  ))
}

function TaxonomyMobileSkeletonCards() {
  return Array.from({ length: 3 }).map((_, index) => (
    <article
      key={`mobile-skeleton-${index}`}
      className="space-y-3 rounded-md border border-border/60 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="size-2.5 rounded-full" />
            <Skeleton className="h-4 w-2/5" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </article>
  ))
}

export function TaxonomyManager({
  kind,
  title,
  description,
  emptyLabel,
}: TaxonomyManagerProps) {
  const {
    exerciseTypes,
    bodyRegions,
    isLoading,
    isMutating,
    error,
    mutationError,
    createTaxonomyItem,
    updateTaxonomyItem,
    reorderTaxonomyItem,
    deleteTaxonomyItem,
  } = useUserExerciseTaxonomy()
  const items = useMemo(
    () => (kind === "type" ? exerciseTypes : bodyRegions),
    [bodyRegions, exerciseTypes, kind]
  )
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [activeCell, setActiveCell] = useState<ActiveTaxonomyCell | null>(null)
  const [cellFormValues, setCellFormValues] =
    useState<TaxonomyFormValues>(EMPTY_FORM_VALUES)
  const [cellFormError, setCellFormError] = useState<string | null>(null)
  const [pendingDeleteItem, setPendingDeleteItem] =
    useState<TaxonomyItem | null>(null)
  const [formValues, setFormValues] =
    useState<TaxonomyFormValues>(EMPTY_FORM_VALUES)
  const [formError, setFormError] = useState<string | null>(null)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null)
  const [dropPlacement, setDropPlacement] =
    useState<DropPlacement>("before")
  const shouldSkipNextCellSaveRef = useRef(false)

  function openCreateForm() {
    setFormValues(EMPTY_FORM_VALUES)
    setFormError(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setFormValues(EMPTY_FORM_VALUES)
    setFormError(null)
  }

  function openCellEdit(item: TaxonomyItem, field: EditableTaxonomyField) {
    if (isMutating) {
      return
    }

    setActiveCell({ itemId: item.id, field })
    setCellFormValues(itemToFormValues(item))
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

  function isActiveCell(itemId: string, field: EditableTaxonomyField) {
    return activeCell?.itemId === itemId && activeCell.field === field
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const name = formValues.name.trim()
    if (!name) {
      setFormError("Name is required.")
      return
    }

    let createSortKey = generateKeyBetween(getLastSortKey(items), null)

    if (hasUnusableSortKeys(items)) {
      const sortKeys = generateNKeysBetween(null, null, items.length + 1)
      const reindexResults = await Promise.all(
        items.map((item, index) =>
          reorderTaxonomyItem({
            kind,
            itemId: item.id,
            sort_key: sortKeys[index],
          })
        )
      )
      const reindexError = reindexResults.find((result) => result.error)?.error
      if (reindexError) {
        setFormError(reindexError)
        return
      }
      createSortKey = sortKeys[items.length]
    }

    const result = await createTaxonomyItem({
      kind,
      name,
      description: optionalText(formValues.description),
      display_color: formValues.displayColor,
      sort_key: createSortKey,
    })

    if (result.error) {
      setFormError(result.error)
      return
    }

    closeForm()
  }

  async function handleCellSave(item: TaxonomyItem) {
    if (shouldSkipNextCellSaveRef.current) {
      shouldSkipNextCellSaveRef.current = false
      return
    }

    if (!activeCell || activeCell.itemId !== item.id) {
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
      name !== item.name ||
      description !== item.description ||
      cellFormValues.displayColor !== item.display_color

    if (!hasChanges) {
      closeCellEdit()
      return
    }

    const result = await updateTaxonomyItem({
      kind,
      itemId: item.id,
      name,
      description,
      display_color: cellFormValues.displayColor,
    })

    if (result.error) {
      setCellFormError(result.error)
      return
    }

    closeCellEdit()
  }

  async function handleColorCellSelect(
    item: TaxonomyItem,
    displayColor: string | null
  ) {
    setCellFormError(null)

    if (displayColor === item.display_color) {
      closeCellEdit()
      return
    }

    const result = await updateTaxonomyItem({
      kind,
      itemId: item.id,
      name: item.name,
      description: item.description,
      display_color: displayColor,
    })

    if (result.error) {
      setCellFormError(result.error)
      return
    }

    closeCellEdit()
  }

  function handleDragStart(
    event: DragEvent<HTMLButtonElement>,
    itemId: string
  ) {
    event.stopPropagation()
    setDraggedItemId(itemId)
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData(`application/x-exercise-taxonomy-${kind}`, itemId)
  }

  async function handleDrop(event: DragEvent<HTMLElement>, targetItemId: string) {
    event.preventDefault()

    const droppedItemId =
      draggedItemId ||
      event.dataTransfer.getData(`application/x-exercise-taxonomy-${kind}`)

    if (!droppedItemId || droppedItemId === targetItemId) {
      setDraggedItemId(null)
      setDragOverItemId(null)
      setDropPlacement("before")
      return
    }

    const placement = getDropPlacement(event)
    const sortKey = getSortKeyForDrop(
      items,
      droppedItemId,
      targetItemId,
      placement
    )
    if (sortKey && !hasUnusableSortKeys(items)) {
      await reorderTaxonomyItem({
        kind,
        itemId: droppedItemId,
        sort_key: sortKey,
      })
    } else {
      const nextOrder = getItemsForDrop(
        items,
        droppedItemId,
        targetItemId,
        placement
      )
      if (nextOrder) {
        const sortKeys = generateNKeysBetween(null, null, nextOrder.length)
        await Promise.all(
          nextOrder.map((item, index) =>
            reorderTaxonomyItem({
              kind,
              itemId: item.id,
              sort_key: sortKeys[index],
            })
          )
        )
      }
    }

    setDraggedItemId(null)
    setDragOverItemId(null)
    setDropPlacement("before")
  }

  async function handleDeleteItem() {
    if (!pendingDeleteItem) {
      return
    }

    const result = await deleteTaxonomyItem({
      kind,
      itemId: pendingDeleteItem.id,
    })
    if (!result.error) {
      setPendingDeleteItem(null)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="font-heading text-xl font-medium sm:text-xl">
            {title}
          </h1>
          <p className="max-w-3xl text-xs text-muted-foreground">
            {description}
          </p>
        </div>
        <Button
          type="button"
          className="size-9 rounded-full shadow-lg"
          onClick={openCreateForm}
          aria-label={`Add ${title}`}
        >
          <PlusIcon />
        </Button>
      </div>

      {error || mutationError ? (
        <p className="text-sm text-destructive">{error ?? mutationError}</p>
      ) : null}

      <div className="hidden min-h-0 flex-1 overflow-auto rounded-md border border-border/60 md:block">
        <table className="w-full min-w-[760px] table-fixed text-left text-sm">
          <colgroup>
            <col className="w-12" />
            <col className="w-[15rem]" />
            <col />
            <col className="w-24" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium" />
              <th className="px-4 py-3 font-medium">Label</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TaxonomyDesktopSkeletonRows />
            ) : items.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={4}>
                  {emptyLabel}
                </td>
              </tr>
            ) : null}
            {items.map((item) => {
              const isDragOver = dragOverItemId === item.id
              const isEditingItem = activeCell?.itemId === item.id
              const isEditingName = isActiveCell(item.id, "name")
              const isEditingDescription = isActiveCell(
                item.id,
                "description"
              )
              return (
                <tr
                  key={item.id}
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
                    setDragOverItemId(item.id)
                    setDropPlacement(getDropPlacement(event))
                  }}
                  onDragLeave={() => {
                    setDragOverItemId(null)
                  }}
                  onDrop={(event) => {
                    void handleDrop(event, item.id)
                  }}
                >
                  <td className="px-4 py-3 align-middle">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      draggable={!isEditingItem}
                      disabled={isEditingItem}
                      aria-label={`Drag ${item.name}`}
                      onDragStart={(event) => handleDragStart(event, item.id)}
                      onDragEnd={() => {
                        setDraggedItemId(null)
                        setDragOverItemId(null)
                      }}
                    >
                      <GripVerticalIcon />
                    </Button>
                  </td>
                  <td
                    className="cursor-text px-4 py-3 align-middle"
                    onDoubleClick={() => openCellEdit(item, "name")}
                  >
                    <div className="space-y-1">
                      {isEditingName ? (
                        <div className="flex min-w-0 items-center gap-2">
                          <TaxonomyColorDropdown
                            item={item}
                            onSelect={(displayColor) => {
                              void handleColorCellSelect(item, displayColor)
                            }}
                          />
                          <Input
                            autoFocus
                            className={CELL_NAME_EDITOR_CLASS}
                            value={cellFormValues.name}
                            maxLength={120}
                            aria-label={`Name for ${item.name}`}
                            onBlur={() => {
                              void handleCellSave(item)
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
                          <TaxonomyColorDropdown
                            item={item}
                            onSelect={(displayColor) => {
                              void handleColorCellSelect(item, displayColor)
                            }}
                          />
                          <div className="line-clamp-2 cursor-text font-medium text-foreground">
                            {item.name}
                          </div>
                        </div>
                      )}
                      {isEditingName && cellFormError ? (
                        <p className="text-xs text-destructive">
                          {cellFormError}
                        </p>
                      ) : null}
                    </div>
                  </td>
                  <td
                    className="cursor-text px-4 py-3 align-middle"
                    onDoubleClick={() => openCellEdit(item, "description")}
                  >
                    <div className="space-y-1">
                      {isEditingDescription ? (
                        <Input
                          autoFocus
                          value={cellFormValues.description}
                          aria-label={`Description for ${item.name}`}
                          className={CELL_DESCRIPTION_EDITOR_CLASS}
                          onBlur={() => {
                            void handleCellSave(item)
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
                          {item.description ?? "No description"}
                        </div>
                      )}
                      {isEditingDescription && cellFormError ? (
                        <p className="text-xs text-destructive">
                          {cellFormError}
                        </p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex justify-end gap-1">
                      <TaxonomyActionsMenu
                        item={item}
                        disabled={isMutating}
                        onDelete={setPendingDeleteItem}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <TaxonomyMobileSkeletonCards />
        ) : items.length === 0 ? (
          <div className="rounded-md border border-border/60 px-4 py-6 text-sm text-muted-foreground">
            {emptyLabel}
          </div>
        ) : (
          items.map((item) => {
            const isDragOver = dragOverItemId === item.id
            const isEditingItem = activeCell?.itemId === item.id
            const isEditingName = isActiveCell(item.id, "name")
            const isEditingDescription = isActiveCell(item.id, "description")
            return (
              <article
                key={item.id}
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
                  setDragOverItemId(item.id)
                  setDropPlacement(getDropPlacement(event))
                }}
                onDragLeave={() => {
                  setDragOverItemId(null)
                }}
                onDrop={(event) => {
                  void handleDrop(event, item.id)
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="space-y-1">
                      {isEditingName ? (
                        <div className="flex min-w-0 items-center gap-2">
                          <TaxonomyColorDropdown
                            item={item}
                            onSelect={(displayColor) => {
                              void handleColorCellSelect(item, displayColor)
                            }}
                          />
                          <Input
                            autoFocus
                            className={CELL_NAME_EDITOR_CLASS}
                            value={cellFormValues.name}
                            maxLength={120}
                            aria-label={`Name for ${item.name}`}
                            onBlur={() => {
                              void handleCellSave(item)
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
                          <TaxonomyColorDropdown
                            item={item}
                            onSelect={(displayColor) => {
                              void handleColorCellSelect(item, displayColor)
                            }}
                          />
                          <h3
                            className="line-clamp-2 cursor-text font-medium text-foreground"
                            onClick={() => openCellEdit(item, "name")}
                          >
                            {item.name}
                          </h3>
                        </div>
                      )}
                      {isEditingName && cellFormError ? (
                        <p className="text-xs text-destructive">
                          {cellFormError}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      draggable={!isEditingItem}
                      disabled={isEditingItem}
                      aria-label={`Drag ${item.name}`}
                      onDragStart={(event) => handleDragStart(event, item.id)}
                      onDragEnd={() => {
                        setDraggedItemId(null)
                        setDragOverItemId(null)
                      }}
                    >
                      <GripVerticalIcon />
                    </Button>
                    <TaxonomyActionsMenu
                      item={item}
                      disabled={isMutating}
                      onDelete={setPendingDeleteItem}
                    />
                  </div>
                </div>

                {isEditingDescription ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Input
                        autoFocus
                        value={cellFormValues.description}
                        aria-label={`Description for ${item.name}`}
                        className={CELL_DESCRIPTION_EDITOR_CLASS}
                        onBlur={() => {
                          void handleCellSave(item)
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
                  </div>
                ) : (
                  <>
                    <p
                      className="line-clamp-1 cursor-text text-muted-foreground"
                      onClick={() => openCellEdit(item, "description")}
                    >
                      {item.description ?? "No description"}
                    </p>
                  </>
                )}
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
              <DialogTitle>Add {title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="taxonomy-name">Name</Label>
              <Input
                id="taxonomy-name"
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
              <Label htmlFor="taxonomy-description">Description</Label>
              <Textarea
                id="taxonomy-description"
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
        open={Boolean(pendingDeleteItem)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteItem(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete taxonomy row?</AlertDialogTitle>
            <AlertDialogDescription>
              {`This will delete "${pendingDeleteItem?.name ?? "this row"}" and remove it from assigned exercises. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMutating}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isMutating}
              onClick={() => {
                void handleDeleteItem()
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
