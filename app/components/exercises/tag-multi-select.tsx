"use client"

import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

type TagMultiSelectProps = {
  options: string[]
  values: string[]
  onChange: (nextValues: string[]) => void
}

export function TagMultiSelect({
  options,
  values,
  onChange,
}: TagMultiSelectProps) {
  const [query, setQuery] = useState("")
  const normalizedQuery = query.trim()
  const searchableOptions = useMemo(
    () =>
      Array.from(new Set([...options, ...values])).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      ),
    [options, values]
  )

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) {
      return searchableOptions
    }

    const lowerQuery = normalizedQuery.toLowerCase()
    return searchableOptions.filter((option) =>
      option.toLowerCase().includes(lowerQuery)
    )
  }, [normalizedQuery, searchableOptions])

  const canCreate =
    normalizedQuery.length > 0 &&
    !searchableOptions.some(
      (option) => option.toLowerCase() === normalizedQuery.toLowerCase()
    )

  function toggleTag(tag: string) {
    const exists = values.some((value) => value === tag)
    if (exists) {
      onChange(values.filter((value) => value !== tag))
      return
    }

    onChange([...values, tag])
  }

  function createTag() {
    if (!canCreate) {
      return
    }

    onChange([...values, normalizedQuery])
    setQuery("")
  }

  return (
    <div className="space-y-2">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" className="w-full justify-between" />}>
          {values.length > 0
            ? `${values.length} tag${values.length === 1 ? "" : "s"} selected`
            : "Select tags"}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-(--anchor-width)">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Exercise tags</DropdownMenuLabel>
          </DropdownMenuGroup>
          <div className="px-2 pb-1">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  createTag()
                }
              }}
              placeholder="Search or type a new tag"
            />
          </div>
          <DropdownMenuSeparator />
          {canCreate ? (
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                createTag()
              }}
            >
              Create &quot;{normalizedQuery}&quot;
            </DropdownMenuItem>
          ) : null}
          {filteredOptions.map((tag) => (
            <DropdownMenuCheckboxItem
              key={tag}
              checked={values.includes(tag)}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={() => toggleTag(tag)}
            >
              {tag}
            </DropdownMenuCheckboxItem>
          ))}
          {filteredOptions.length === 0 && !canCreate ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No matching tags
            </div>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {values.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {values.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}
