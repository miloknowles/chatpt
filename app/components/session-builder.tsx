"use client"

import { useEffect, useMemo, useState, type DragEvent } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { generateKeyBetween } from "fractional-indexing"
import { GripVerticalIcon, GroupIcon, Loader2Icon, SaveIcon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUserExercises } from "@/hooks/use-user-exercises"
import { useUserSessions } from "@/hooks/use-user-sessions"
import { useUserSupersets } from "@/hooks/use-user-supersets"
import { cn } from "@/lib/utils"

function formatDate(dateValue: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateValue))
}

export function SessionBuilder() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selectedSessionId = searchParams.get("session")
  const [draftName, setDraftName] = useState("")
  const [draftNotes, setDraftNotes] = useState("")
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState("")
  const [supersetExerciseNames, setSupersetExerciseNames] = useState<
    Record<string, string[]>
  >({})
  const [draftSupersetNames, setDraftSupersetNames] = useState<
    Record<string, string>
  >({})
  const [draggedSupersetId, setDraggedSupersetId] = useState<string | null>(null)
  const [dragOverSupersetId, setDragOverSupersetId] = useState<string | null>(null)
  const [isAddSupersetDialogOpen, setIsAddSupersetDialogOpen] = useState(false)
  const [newSupersetName, setNewSupersetName] = useState("")
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const {
    sessions,
    isLoading,
    isMutating,
    error,
    mutationError,
    updateSession,
  } = useUserSessions()
  const {
    exercises,
    isLoading: isExerciseSearchLoading,
    error: exerciseSearchError,
  } = useUserExercises({
    pageSize: 8,
    searchQuery: exerciseSearchQuery,
  })

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) ?? sessions[0] ?? null,
    [selectedSessionId, sessions]
  )
  const {
    supersets,
    isLoading: isSupersetLoading,
    isMutating: isSupersetMutating,
    error: supersetError,
    mutationError: supersetMutationError,
    createSuperset,
    updateSuperset,
  } = useUserSupersets(selectedSession?.id)

  useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      setDraftName(selectedSession?.name ?? "")
      setDraftNotes(selectedSession?.notes ?? "")
    }, 0)

    return () => {
      window.clearTimeout(syncTimer)
    }
  }, [selectedSession?.id, selectedSession?.name, selectedSession?.notes])

  useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      setDraftSupersetNames(
        Object.fromEntries(
          supersets.map((superset) => [
            superset.id,
            superset.name ?? "Untitled Superset",
          ])
        )
      )
    }, 0)

    return () => {
      window.clearTimeout(syncTimer)
    }
  }, [supersets])

  useEffect(() => {
    if (!sessions.length || selectedSessionId) {
      return
    }

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set("session", sessions[0].id)
    router.replace(`${pathname}?${nextParams.toString()}`)
  }, [pathname, router, searchParams, selectedSessionId, sessions])

  async function saveSessionName(
    sessionId: string,
    previousName: string,
    nextNameValue: string
  ) {
    const normalizedName = nextNameValue.trim() || "Untitled Session"
    setDraftName(normalizedName)

    if (normalizedName === previousName) {
      return
    }

    setIsSavingDraft(true)
    const result = await updateSession(sessionId, { name: normalizedName })
    setIsSavingDraft(false)

    if (result.error) {
      setSaveError(result.error)
      return
    }

    setSaveError(null)
  }

  async function saveSessionNotes(
    sessionId: string,
    previousNotes: string | null,
    nextNotesValue: string
  ) {
    const normalizedNotes = nextNotesValue.trim() || null
    setDraftNotes(normalizedNotes ?? "")

    if (normalizedNotes === (previousNotes ?? null)) {
      return
    }

    setIsSavingDraft(true)
    const result = await updateSession(sessionId, { notes: normalizedNotes })
    setIsSavingDraft(false)

    if (result.error) {
      setSaveError(result.error)
      return
    }

    setSaveError(null)
  }

  async function saveSessionDraft() {
    if (!selectedSession) {
      return
    }

    await Promise.all([
      saveSessionName(selectedSession.id, selectedSession.name, draftName),
      saveSessionNotes(selectedSession.id, selectedSession.notes, draftNotes),
    ])
  }

  const orderedSupersets = useMemo(
    () => [...supersets].sort((first, second) => first.sort_key.localeCompare(second.sort_key)),
    [supersets]
  )

  function handleSupersetDragStart(
    event: DragEvent<HTMLElement>,
    supersetId: string
  ) {
    setDraggedSupersetId(supersetId)
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("application/x-superset-id", supersetId)
  }

  function handleExerciseDragStart(
    event: DragEvent<HTMLElement>,
    exerciseName: string
  ) {
    event.dataTransfer.effectAllowed = "copy"
    event.dataTransfer.setData("application/x-exercise-name", exerciseName)
  }

  function addExerciseToSuperset(supersetId: string, exerciseName: string) {
    setSupersetExerciseNames((currentExerciseNames) => ({
      ...currentExerciseNames,
      [supersetId]: [...(currentExerciseNames[supersetId] ?? []), exerciseName],
    }))
  }

  function handleSupersetDrop(
    event: DragEvent<HTMLElement>,
    targetSupersetId: string
  ) {
    const exerciseName = event.dataTransfer.getData("application/x-exercise-name")
    if (exerciseName) {
      addExerciseToSuperset(targetSupersetId, exerciseName)
      setDragOverSupersetId(null)
      return
    }

    const droppedSupersetId =
      draggedSupersetId ||
      event.dataTransfer.getData("application/x-superset-id")

    if (!droppedSupersetId || droppedSupersetId === targetSupersetId) {
      setDraggedSupersetId(null)
      setDragOverSupersetId(null)
      return
    }

    const nextOrder = orderedSupersets.filter(
      (superset) => superset.id !== droppedSupersetId
    )
    const targetIndex = nextOrder.findIndex(
      (superset) => superset.id === targetSupersetId
    )

    if (targetIndex < 0) {
      setDraggedSupersetId(null)
      setDragOverSupersetId(null)
      return
    }

    const previousKey = nextOrder[targetIndex - 1]?.sort_key ?? null
    const nextKey = nextOrder[targetIndex]?.sort_key ?? null
    const sortKey = generateKeyBetween(previousKey, nextKey)

    void updateSuperset(droppedSupersetId, { sort_key: sortKey })
    setDraggedSupersetId(null)
    setDragOverSupersetId(null)
  }

  async function handleCreateSuperset() {
    if (!selectedSession) {
      return
    }

    const name = newSupersetName.trim()
    if (!name) {
      return
    }

    const lastSortKey = orderedSupersets.at(-1)?.sort_key ?? null
    const result = await createSuperset({
      sessionId: selectedSession.id,
      name,
      sortKey: generateKeyBetween(lastSortKey, null),
    })

    if (result.error) {
      return
    }

    setNewSupersetName("")
    setIsAddSupersetDialogOpen(false)
  }

  async function saveSupersetName(supersetId: string, previousName: string | null) {
    const normalizedName =
      draftSupersetNames[supersetId]?.trim() || "Untitled Superset"
    setDraftSupersetNames((currentNames) => ({
      ...currentNames,
      [supersetId]: normalizedName,
    }))

    if (normalizedName === (previousName ?? "Untitled Superset")) {
      return
    }

    await updateSuperset(supersetId, { name: normalizedName })
  }

  return (
    <div className="space-y-4">
      {!selectedSession ? (
        <div className="text-sm text-muted-foreground">
          {isLoading
            ? "Loading sessions..."
            : "Select a session from the left sidebar to start editing."}
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <aside className="space-y-3 border-b border-border/60 pb-4 lg:border-r lg:border-b-0 lg:pr-4 lg:pb-0">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              disabled={isSupersetMutating}
              onClick={() => setIsAddSupersetDialogOpen(true)}
            >
              <GroupIcon />
              Add Superset
            </Button>
            <Input
              value={exerciseSearchQuery}
              onChange={(event) => setExerciseSearchQuery(event.target.value)}
              placeholder="Search exercises"
            />
            <div className="space-y-1">
              {isExerciseSearchLoading ? (
                <div className="px-2 py-2 text-sm text-muted-foreground">
                  Searching...
                </div>
              ) : exercises.length === 0 ? (
                <div className="px-2 py-2 text-sm text-muted-foreground">
                  No exercises found
                </div>
              ) : (
                exercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    draggable
                    onDragStart={(event) =>
                      handleExerciseDragStart(event, exercise.name)
                    }
                    className="cursor-grab rounded-md border border-border/60 bg-background px-3 py-2 text-sm shadow-xs active:cursor-grabbing"
                  >
                    <div className="truncate font-medium">{exercise.name}</div>
                    {exercise.notes ? (
                      <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {exercise.notes}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
            {exerciseSearchError ? (
              <p className="text-sm text-destructive">{exerciseSearchError}</p>
            ) : null}
          </aside>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                onBlur={(event) =>
                  void saveSessionName(
                    selectedSession.id,
                    selectedSession.name,
                    event.target.value
                  )
                }
                placeholder="Session name"
                className="h-12 rounded-md border-border px-3 text-md font-semibold shadow-xs focus-visible:ring-2 md:text-xl"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-12"
                aria-label="Save session"
                disabled={isSavingDraft || isMutating}
                onClick={() => void saveSessionDraft()}
              >
                {isSavingDraft || isMutating ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  <SaveIcon />
                )}
              </Button>
            </div>
            <Textarea
              value={draftNotes}
              onChange={(event) => setDraftNotes(event.target.value)}
              onBlur={(event) =>
                void saveSessionNotes(
                  selectedSession.id,
                  selectedSession.notes,
                  event.target.value
                )
              }
              placeholder="Session description"
              className="min-h-32 resize-y"
            />
            <p className="text-xs text-muted-foreground">
              Last updated {formatDate(selectedSession.updated_at)}
            </p>

            <div className="space-y-3 pt-2">
              {isSupersetLoading ? (
                <div className="rounded-md border border-border/60 px-4 py-6 text-sm text-muted-foreground">
                  Loading supersets...
                </div>
              ) : orderedSupersets.length === 0 ? (
                <div className="rounded-md border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
                  Add a superset to start building this session.
                </div>
              ) : (
                orderedSupersets.map((superset) => {
                  const isDragging = draggedSupersetId === superset.id
                  const isDragTarget = dragOverSupersetId === superset.id
                  const exerciseNames = supersetExerciseNames[superset.id] ?? []

                  return (
                    <article
                      key={superset.id}
                      draggable
                      onDragStart={(event) =>
                        handleSupersetDragStart(event, superset.id)
                      }
                      onDragEnd={() => {
                        setDraggedSupersetId(null)
                        setDragOverSupersetId(null)
                      }}
                      onDragOver={(event) => {
                        event.preventDefault()
                        event.dataTransfer.dropEffect = "move"
                        setDragOverSupersetId(superset.id)
                      }}
                      onDragLeave={() => setDragOverSupersetId(null)}
                      onDrop={(event) => {
                        event.preventDefault()
                        handleSupersetDrop(event, superset.id)
                      }}
                      className={cn(
                        "cursor-grab rounded-md border border-border/70 bg-background p-4 shadow-xs transition active:cursor-grabbing",
                        isDragging && "opacity-50",
                        isDragTarget && "border-primary bg-muted/30"
                      )}
                    >
                      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <div className="flex items-center gap-2">
                          <GripVerticalIcon className="size-4 text-muted-foreground" />
                          <Badge variant="secondary" className="uppercase text-xs tracking-wider">Superset</Badge>
                        </div>
                        <Input
                          value={
                            draftSupersetNames[superset.id] ??
                            superset.name ??
                            "Untitled Superset"
                          }
                          onChange={(event) =>
                            setDraftSupersetNames((currentNames) => ({
                              ...currentNames,
                              [superset.id]: event.target.value,
                            }))
                          }
                          onBlur={() =>
                            void saveSupersetName(superset.id, superset.name)
                          }
                          className="h-8 min-w-0 border-border text-center text-sm font-medium uppercase tracker-wider"
                          aria-label="Superset name"
                        />
                        <div className="text-right text-xs font-medium text-muted-foreground">
                          {exerciseNames.length}{" "}
                          {exerciseNames.length === 1 ? "exercise" : "exercises"}
                        </div>
                      </header>
                      {exerciseNames.length > 0 ? (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {exerciseNames.map((exerciseName, index) => (
                            <div
                              key={`${superset.id}-${exerciseName}-${index}`}
                              className="rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-sm"
                            >
                              {exerciseName}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 rounded-md border border-dashed border-border/70 px-3 py-4 text-center text-sm text-muted-foreground">
                          Drop exercises here
                        </div>
                      )}
                    </article>
                  )
                }))}
            </div>
          </div>
        </div>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {mutationError ? <p className="text-sm text-destructive">{mutationError}</p> : null}
      {saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}
      {supersetError ? <p className="text-sm text-destructive">{supersetError}</p> : null}
      {supersetMutationError ? (
        <p className="text-sm text-destructive">{supersetMutationError}</p>
      ) : null}

      <AlertDialog
        open={isAddSupersetDialogOpen}
        onOpenChange={setIsAddSupersetDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Superset</AlertDialogTitle>
            <AlertDialogDescription>
              Name the superset before adding exercises.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="superset-name">Name</Label>
            <Input
              id="superset-name"
              value={newSupersetName}
              onChange={(event) => setNewSupersetName(event.target.value)}
              placeholder="Posterior chain"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  void handleCreateSuperset()
                }
              }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              type="button"
              disabled={!newSupersetName.trim() || isSupersetMutating}
              onClick={() => void handleCreateSuperset()}
            >
              {isSupersetMutating ? "Adding..." : "Add Superset"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
