"use client"

import { useMemo, useState, type FormEvent } from "react"
import { MoreHorizontalIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  getTaxonomyColorDotClass,
  TAXONOMY_COLOR_OPTIONS,
} from "./taxonomy-colors"
import type { ExerciseTaxonomyItem, ExerciseTaxonomySelection } from "./types"

type TaxonomyMultiSelectProps = {
  label: string
  createLabel: string
  emptyLabel: string
  options: ExerciseTaxonomyItem[]
  values: ExerciseTaxonomySelection[]
  onChange: (nextValues: ExerciseTaxonomySelection[]) => void
  onUpdateItem: (
    item: ExerciseTaxonomyItem,
    values: { name: string; display_color: string | null }
  ) => Promise<{ error?: string }>
}

export function TaxonomyMultiSelect({
  label,
  createLabel,
  emptyLabel,
  options,
  values,
  onChange,
  onUpdateItem,
}: TaxonomyMultiSelectProps) {
  const [query, setQuery] = useState("")
  const [editingItem, setEditingItem] = useState<ExerciseTaxonomyItem | null>(
    null
  )
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const normalizedQuery = query.trim()
  const searchableOptions = useMemo(
    () => {
      const optionValues = new Map<string, ExerciseTaxonomySelection>()

      for (const option of options) {
        optionValues.set(option.name.toLowerCase(), {
          id: option.id,
          name: option.name,
          display_color: option.display_color,
        })
      }

      for (const value of values) {
        optionValues.set(value.name.toLowerCase(), value)
      }

      return Array.from(optionValues.values()).sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      )
    },
    [options, values]
  )

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) {
      return searchableOptions
    }

    const lowerQuery = normalizedQuery.toLowerCase()
    return searchableOptions.filter((option) =>
      option.name.toLowerCase().includes(lowerQuery)
    )
  }, [normalizedQuery, searchableOptions])

  const canCreate =
    normalizedQuery.length > 0 &&
    !searchableOptions.some(
      (option) => option.name.toLowerCase() === normalizedQuery.toLowerCase()
    )

  function isSelected(item: ExerciseTaxonomySelection) {
    return values.some((value) =>
      item.id ? value.id === item.id : value.name === item.name
    )
  }

  function toggleValue(item: ExerciseTaxonomySelection) {
    const exists = isSelected(item)
    if (exists) {
      onChange(
        values.filter((value) =>
          item.id ? value.id !== item.id : value.name !== item.name
        )
      )
      return
    }

    onChange([...values, item])
  }

  function createValue() {
    if (!canCreate) {
      return
    }

    onChange([...values, { name: normalizedQuery }])
    setQuery("")
  }

  function getDisplayColor(item: ExerciseTaxonomySelection) {
    return item.display_color ?? null
  }

  function openEditDialog(item: ExerciseTaxonomyItem) {
    setEditingItem(item)
    setEditName(item.name)
    setEditColor(item.display_color)
    setEditError(null)
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editingItem) {
      return
    }

    const nextName = editName.trim()
    if (!nextName) {
      setEditError("Name is required.")
      return
    }

    setIsSavingEdit(true)
    setEditError(null)
    const result = await onUpdateItem(editingItem, {
      name: nextName,
      display_color: editColor,
    })
    setIsSavingEdit(false)

    if (result.error) {
      setEditError(result.error)
      return
    }

    onChange(
      values.map((value) =>
        value.id === editingItem.id
          ? { ...value, name: nextName, display_color: editColor }
          : value
      )
    )
    setEditingItem(null)
  }

  return (
    <div className="space-y-2">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" className="w-full justify-between" />}>
          {values.length > 0
            ? `${values.length} selected`
            : emptyLabel}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-(--anchor-width)">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{label}</DropdownMenuLabel>
          </DropdownMenuGroup>
          <div className="px-2 pb-1">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onPointerDown={(event) => event.stopPropagation()}
              onKeyDownCapture={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  createValue()
                }
              }}
              placeholder="Search or type a new option"
            />
          </div>
          <DropdownMenuSeparator />
          {canCreate ? (
            <DropdownMenuItem
              onClick={(event) => {
                event.preventDefault()
                createValue()
              }}
            >
              {createLabel} &quot;{normalizedQuery}&quot;
            </DropdownMenuItem>
          ) : null}
          {filteredOptions.map((option) => {
            const optionRow = options.find((item) => item.id === option.id)

            return (
              <div
                key={option.id ?? option.name}
                className="flex items-center gap-1"
              >
                <DropdownMenuCheckboxItem
                  className="min-w-0 flex-1"
                  checked={isSelected(option)}
                  onSelect={(event) => event.preventDefault()}
                  onCheckedChange={() => toggleValue(option)}
                >
                  <span
                    className={`size-2 rounded-full border border-border ${getTaxonomyColorDotClass(getDisplayColor(option))}`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{option.name}</span>
                </DropdownMenuCheckboxItem>
                {optionRow ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="mr-1"
                          aria-label={`Actions for ${option.name}`}
                        />
                      }
                      onClick={(event) => event.stopPropagation()}
                    >
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-36">
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          openEditDialog(optionRow)
                        }}
                      >
                        Edit option
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
            )
          })}
          {filteredOptions.length === 0 && !canCreate ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No matching options
            </div>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {values.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {values.map((value) => (
            <Badge key={value.id ?? value.name} variant="secondary">
              <span
                className={`size-2 rounded-full border border-border ${getTaxonomyColorDotClass(getDisplayColor(value))}`}
                aria-hidden="true"
              />
              {value.name}
            </Badge>
          ))}
        </div>
      ) : null}

      <Dialog
        open={Boolean(editingItem)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingItem(null)
          }
        }}
      >
        <DialogContent>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Edit {label.toLowerCase()}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="taxonomy-option-name">Name</Label>
              <Input
                id="taxonomy-option-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                maxLength={120}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-3 gap-2">
                {TAXONOMY_COLOR_OPTIONS.map((option) => (
                  <Button
                    key={option.label}
                    type="button"
                    variant={editColor === option.value ? "secondary" : "outline"}
                    className="justify-start"
                    onClick={() => setEditColor(option.value)}
                  >
                    <span
                      className={`size-3 rounded-full border border-border ${option.dotClassName}`}
                      aria-hidden="true"
                    />
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
            {editError ? (
              <p className="text-sm text-destructive">{editError}</p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingItem(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSavingEdit}>
                {isSavingEdit ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
