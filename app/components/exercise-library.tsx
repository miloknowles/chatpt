"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { useIsMobile } from "@/hooks/use-mobile"
import { useUserExercises } from "@/hooks/use-user-exercises"
import type { Database, Json } from "@/types/database"

type UserExercise = Database["public"]["Tables"]["user_exercises"]["Row"]

type ExerciseFormValues = {
  name: string
  notes: string
  imageUrl: string
  videoUrl: string
  tags: string[]
  performanceText: string
}

const EMPTY_FORM_VALUES: ExerciseFormValues = {
  name: "",
  notes: "",
  imageUrl: "",
  videoUrl: "",
  tags: [],
  performanceText: "",
}

function parsePerformanceToFormValues(
  performance: Json | null
): Pick<ExerciseFormValues, "performanceText"> {
  const emptyValues: Pick<ExerciseFormValues, "performanceText"> = {
    performanceText: "",
  }

  if (!performance) {
    return emptyValues
  }

  if (typeof performance === "string") {
    return {
      ...emptyValues,
      performanceText: performance,
    }
  }

  if (typeof performance === "object" && !Array.isArray(performance)) {
    const performanceObject = performance as Record<string, Json | undefined>

    if (Array.isArray(performanceObject.sets)) {
      const rows = performanceObject.sets
        .map((entry) => {
          if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
            return null
          }

          const repsValue = (entry as Record<string, Json | undefined>).reps
          const weightValue = (entry as Record<string, Json | undefined>).weight

          const reps =
            typeof repsValue === "number" && Number.isFinite(repsValue)
              ? String(repsValue)
              : ""
          const weight =
            typeof weightValue === "number" && Number.isFinite(weightValue)
              ? String(weightValue)
              : ""

          if (!reps && !weight) {
            return null
          }

          return { reps, weight }
        })
        .filter((row): row is { reps: string; weight: string } => row !== null)

      const text = rows
        .map((row) => {
          if (row.reps && row.weight) {
            return `${row.reps} reps @ ${row.weight}`
          }
          if (row.reps) {
            return `${row.reps} reps`
          }
          return `Weight: ${row.weight}`
        })
        .join("\n")

      return {
        ...emptyValues,
        performanceText: text,
      }
    }

    const durationSecondsValue = performanceObject.duration_s
    if (
      typeof durationSecondsValue === "number" &&
      Number.isFinite(durationSecondsValue) &&
      durationSecondsValue > 0
    ) {
      return {
        ...emptyValues,
        performanceText: `Duration: ${durationSecondsValue / 60} minutes`,
      }
    }

    const durationMinutesValue = performanceObject.duration_minutes
    if (
      typeof durationMinutesValue === "number" &&
      Number.isFinite(durationMinutesValue) &&
      durationMinutesValue > 0
    ) {
      return {
        ...emptyValues,
        performanceText: `Duration: ${durationMinutesValue} minutes`,
      }
    }

    const textValue = performanceObject.text ?? performanceObject.notes
    if (typeof textValue === "string") {
      return {
        ...emptyValues,
        performanceText: textValue,
      }
    }
  }

  return {
    ...emptyValues,
    performanceText: JSON.stringify(performance, null, 2),
  }
}

function toFormValues(exercise: UserExercise): ExerciseFormValues {
  const performanceValues = parsePerformanceToFormValues(exercise.performance)

  return {
    name: exercise.name,
    notes: exercise.notes ?? "",
    imageUrl: exercise.image_url ?? "",
    videoUrl: exercise.video_url ?? "",
    tags: exercise.tags ?? [],
    ...performanceValues,
  }
}

function toPayload(values: ExerciseFormValues) {
  const name = values.name.trim()

  if (!name) {
    return { error: "Name is required." }
  }

  const tags = Array.from(
    new Set(values.tags.map((tag) => tag.trim()).filter(Boolean))
  )

  let performance: Json | null = null

  const text = values.performanceText.trim()
  if (text) {
    performance = {
      type: "custom",
      text,
    }
  }

  return {
    payload: {
      name,
      notes: values.notes.trim() || null,
      image_url: values.imageUrl.trim() || null,
      video_url: values.videoUrl.trim() || null,
      tags: tags.length ? tags : null,
      performance,
    },
  }
}

function TagMultiSelect({
  options,
  values,
  onChange,
}: {
  options: string[]
  values: string[]
  onChange: (nextValues: string[]) => void
}) {
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

function formatDate(dateValue: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateValue))
}

function parseUrl(urlValue: string) {
  try {
    return new URL(urlValue)
  } catch {
    return null
  }
}

function getYouTubeVideoId(videoUrl: string) {
  const parsedUrl = parseUrl(videoUrl)
  if (!parsedUrl) {
    return null
  }

  const hostname = parsedUrl.hostname.toLowerCase()

  if (hostname === "youtu.be") {
    const id = parsedUrl.pathname.split("/").filter(Boolean)[0]
    return id || null
  }

  if (hostname.endsWith("youtube.com")) {
    if (parsedUrl.pathname === "/watch") {
      return parsedUrl.searchParams.get("v")
    }

    const pathSegments = parsedUrl.pathname.split("/").filter(Boolean)
    const embedIndex = pathSegments.findIndex(
      (segment) => segment === "embed" || segment === "shorts"
    )
    if (embedIndex >= 0 && pathSegments[embedIndex + 1]) {
      return pathSegments[embedIndex + 1]
    }
  }

  return null
}

function getVimeoVideoId(videoUrl: string) {
  const parsedUrl = parseUrl(videoUrl)
  if (!parsedUrl) {
    return null
  }

  const hostname = parsedUrl.hostname.toLowerCase()
  if (!hostname.endsWith("vimeo.com")) {
    return null
  }

  const match = parsedUrl.pathname.match(/\/(\d+)(?:$|\/)/)
  return match?.[1] ?? null
}

function getVideoThumbnailUrl(videoUrl: string) {
  const youtubeVideoId = getYouTubeVideoId(videoUrl)
  if (youtubeVideoId) {
    return `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`
  }

  const vimeoVideoId = getVimeoVideoId(videoUrl)
  if (vimeoVideoId) {
    return `https://vumbnail.com/${vimeoVideoId}.jpg`
  }

  return null
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
  const isDeleteDialogOpen = Boolean(exercisePendingDelete)
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
    <div className="space-y-4">
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

      <div className="space-y-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <article
              key={`mobile-skeleton-${index}`}
              className="space-y-3 rounded-md border border-border/60 p-4"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-10" />
              </div>
              <div className="flex items-end justify-between gap-2 pt-1">
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </article>
          ))
        ) : tableEmptyState ? (
          <div className="rounded-md border border-border/60 px-4 py-6 text-sm text-muted-foreground">
            {tableEmptyState}
          </div>
        ) : (
          exercises.map((exercise) => {
            const hasImage = Boolean(exercise.image_url)
            const hasVideo = Boolean(exercise.video_url)
            const videoThumbnailUrl = exercise.video_url
              ? getVideoThumbnailUrl(exercise.video_url)
              : null

            return (
              <article key={exercise.id} className="space-y-3 rounded-md border border-border/60 p-4">
                <div>
                  <h3 className="font-medium text-foreground">{exercise.name}</h3>
                  {exercise.notes ? (
                    <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                      {exercise.notes}
                    </p>
                  ) : null}
                </div>

                {hasImage || hasVideo ? (
                  <div className="space-y-2 text-xs">
                    {hasImage ? (
                      <div className="space-y-1">
                        <a
                          href={exercise.image_url ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="block w-fit overflow-hidden rounded-md border border-border/60"
                        >
                          <img
                            src={exercise.image_url ?? ""}
                            alt={`${exercise.name} image`}
                            className="h-14 w-24 object-cover"
                            loading="lazy"
                          />
                        </a>
                        <a
                          href={exercise.image_url ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-primary underline-offset-4 hover:underline"
                        >
                          Image
                        </a>
                      </div>
                    ) : null}
                    {hasVideo ? (
                      <div className="space-y-1">
                        {videoThumbnailUrl ? (
                          <a
                            href={exercise.video_url ?? "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="block w-fit overflow-hidden rounded-md border border-border/60"
                          >
                            <img
                              src={videoThumbnailUrl}
                              alt={`${exercise.name} video preview`}
                              className="h-14 w-24 object-cover"
                              loading="lazy"
                            />
                          </a>
                        ) : null}
                        <a
                          href={exercise.video_url ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-primary underline-offset-4 hover:underline"
                        >
                          Video
                        </a>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex items-end justify-between gap-2 pt-1">
                  <div className="flex flex-wrap gap-1">
                    {exercise.tags?.length ? (
                      exercise.tags.map((tag) => (
                        <Badge key={`${exercise.id}-${tag}`} variant="outline">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No tags</span>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="outline"
                          size="icon-sm"
                          aria-label={`Actions for ${exercise.name}`}
                          disabled={isSubmitting}
                        />
                      }
                    >
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-36">
                      <DropdownMenuItem onClick={() => openEditSheet(exercise)}>
                        <PencilIcon />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => openDeleteDialog(exercise)}
                      >
                        <Trash2Icon />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </article>
            )
          }))}
      </div>

      <div className="hidden overflow-x-auto rounded-md border border-border/60 md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Tags</th>
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
            ) : tableEmptyState ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                  {tableEmptyState}
                </td>
              </tr>
            ) : null}
            {exercises.map((exercise) => {
              const hasImage = Boolean(exercise.image_url)
              const hasVideo = Boolean(exercise.video_url)
              const videoThumbnailUrl = exercise.video_url
                ? getVideoThumbnailUrl(exercise.video_url)
                : null

              return (
                <tr key={exercise.id} className="border-t border-border/50">
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-foreground">{exercise.name}</div>
                    {exercise.notes ? (
                      <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {exercise.notes}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap gap-1">
                      {exercise.tags?.length ? (
                        exercise.tags.map((tag) => (
                          <Badge key={`${exercise.id}-${tag}`} variant="outline">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-muted-foreground">
                    {!hasImage && !hasVideo ? (
                      "None"
                    ) : (
                      <div className="space-y-2 text-xs">
                        {hasImage ? (
                          <div className="space-y-1">
                            <a
                              href={exercise.image_url ?? "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="block w-fit overflow-hidden rounded-md border border-border/60"
                            >
                              <img
                                src={exercise.image_url ?? ""}
                                alt={`${exercise.name} image`}
                                className="h-14 w-24 object-cover"
                                loading="lazy"
                              />
                            </a>
                            <a
                              href={exercise.image_url ?? "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary underline-offset-4 hover:underline"
                            >
                              Image
                            </a>
                          </div>
                        ) : null}
                        {hasVideo ? (
                          <div className="space-y-1">
                            {videoThumbnailUrl ? (
                              <a
                                href={exercise.video_url ?? "#"}
                                target="_blank"
                                rel="noreferrer"
                                className="block w-fit overflow-hidden rounded-md border border-border/60"
                              >
                                <img
                                  src={videoThumbnailUrl}
                                  alt={`${exercise.name} video preview`}
                                  className="h-14 w-24 object-cover"
                                  loading="lazy"
                                />
                              </a>
                            ) : null}
                            <a
                              href={exercise.video_url ?? "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-primary underline-offset-4 hover:underline"
                            >
                              Video
                            </a>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-muted-foreground">
                    {formatDate(exercise.updated_at)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="outline"
                              size="icon-sm"
                              aria-label={`Actions for ${exercise.name}`}
                              disabled={isSubmitting}
                            />
                          }
                        >
                          <MoreHorizontalIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-36">
                          <DropdownMenuItem onClick={() => openEditSheet(exercise)}>
                            <PencilIcon />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => openDeleteDialog(exercise)}
                          >
                            <Trash2Icon />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {mutationError ? <p className="text-sm text-destructive">{mutationError}</p> : null}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exercise?</AlertDialogTitle>
            <AlertDialogDescription>
              {`This will permanently remove "${exercisePendingDelete?.name ?? "this exercise"
                }" from your library.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting}
              onClick={() => void handleDelete()}
            >
              {isSubmitting ? "Deleting..." : "Delete Exercise"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={isMobile ? "h-[85dvh] rounded-t-xl" : "w-full sm:max-w-2xl"}
        >
          <form className="flex h-full flex-col" onSubmit={handleSubmit}>
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
                  onChange={(event) => handleFieldChange("name", event.target.value)}
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
                  onChange={(event) => handleFieldChange("notes", event.target.value)}
                  placeholder="Add cues and notes for yourself"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exercise-image-url">Image URL</Label>
                <Input
                  id="exercise-image-url"
                  type="url"
                  value={formValues.imageUrl}
                  onChange={(event) =>
                    handleFieldChange("imageUrl", event.target.value)
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exercise-video-url">Video URL</Label>
                <Input
                  id="exercise-video-url"
                  type="url"
                  value={formValues.videoUrl}
                  onChange={(event) =>
                    handleFieldChange("videoUrl", event.target.value)
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <TagMultiSelect
                  options={availableTags}
                  values={formValues.tags}
                  onChange={(nextTags) => handleFieldChange("tags", nextTags)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exercise-default-set">Suggested Program</Label>
                <Textarea
                  id="exercise-suggested-program"
                  value={formValues.performanceText}
                  onChange={(event) =>
                    handleFieldChange("performanceText", event.target.value)
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
    </div>
  )
}
