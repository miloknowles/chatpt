"use client"

import { useEffect, useMemo, useState, type DragEvent } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { generateKeyBetween } from "fractional-indexing"

import { useUserExercises } from "@/hooks/use-user-exercises"
import { useUserLoggedExercises } from "@/hooks/use-user-logged-exercises"
import { useUserSessions } from "@/hooks/use-user-sessions"
import { useUserSupersets } from "@/hooks/use-user-supersets"

import { AddSupersetDialog } from "./add-superset-dialog"
import { ExercisePalette } from "./exercise-palette"
import { SessionDetails } from "./session-details"
import { SupersetList } from "./superset-list"
import type { UserExercise } from "./types"

function compareSortKeys(firstKey: string, secondKey: string) {
  if (firstKey === secondKey) {
    return 0
  }

  return firstKey < secondKey ? -1 : 1
}

export function SessionBuilder() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selectedSessionId = searchParams.get("session")
  const [draftName, setDraftName] = useState("")
  const [draftNotes, setDraftNotes] = useState("")
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState("")
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
  const {
    loggedExercises,
    error: loggedExerciseError,
    mutationError: loggedExerciseMutationError,
    createLoggedExercise,
  } = useUserLoggedExercises(selectedSession?.id)

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
    () =>
      [...supersets].sort((first, second) =>
        compareSortKeys(first.sort_key, second.sort_key)
      ),
    [supersets]
  )

  const loggedExercisesBySupersetId = useMemo(() => {
    return loggedExercises.reduce<Record<string, typeof loggedExercises>>(
      (groups, loggedExercise) => {
        if (!loggedExercise.superset_id) {
          return groups
        }

        groups[loggedExercise.superset_id] = [
          ...(groups[loggedExercise.superset_id] ?? []),
          loggedExercise,
        ]

        return groups
      },
      {}
    )
  }, [loggedExercises])

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
    exercise: UserExercise
  ) {
    event.dataTransfer.effectAllowed = "copy"
    event.dataTransfer.setData("application/x-exercise-id", exercise.id)
    event.dataTransfer.setData("application/x-exercise-name", exercise.name)
  }

  async function addExerciseToSuperset(
    supersetId: string,
    exerciseId: string
  ) {
    if (!selectedSession) {
      return
    }

    const lastSortKey =
      loggedExercisesBySupersetId[supersetId]?.at(-1)?.sort_key ?? null

    await createLoggedExercise({
      sessionId: selectedSession.id,
      supersetId,
      exerciseId,
      sortKey: generateKeyBetween(lastSortKey, null),
    })
  }

  function handleSupersetDrop(
    event: DragEvent<HTMLElement>,
    targetSupersetId: string
  ) {
    const exerciseId = event.dataTransfer.getData("application/x-exercise-id")
    if (exerciseId) {
      void addExerciseToSuperset(targetSupersetId, exerciseId)
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
    <div className="h-full min-h-0 space-y-4 md:space-y-0">
      {!selectedSession ? (
        <div className="p-6 text-sm text-muted-foreground">
          {isLoading
            ? "Loading sessions..."
            : "Select a session from the left sidebar to start editing."}
        </div>
      ) : (
        <div className="grid h-full min-h-0 gap-5 md:gap-0 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <ExercisePalette
            exercises={exercises}
            searchQuery={exerciseSearchQuery}
            isLoading={isExerciseSearchLoading}
            isSupersetMutating={isSupersetMutating}
            error={exerciseSearchError}
            onSearchChange={setExerciseSearchQuery}
            onAddSuperset={() => setIsAddSupersetDialogOpen(true)}
            onExerciseDragStart={handleExerciseDragStart}
          />

          <div className="min-h-0 space-y-4 overflow-y-auto md:p-6">
            <SessionDetails
              session={selectedSession}
              draftName={draftName}
              draftNotes={draftNotes}
              isSavingDraft={isSavingDraft}
              isMutating={isMutating}
              onDraftNameChange={setDraftName}
              onDraftNotesChange={setDraftNotes}
              onSaveName={(value) =>
                void saveSessionName(
                  selectedSession.id,
                  selectedSession.name,
                  value
                )
              }
              onSaveNotes={(value) =>
                void saveSessionNotes(
                  selectedSession.id,
                  selectedSession.notes,
                  value
                )
              }
              onSaveDraft={() => void saveSessionDraft()}
            />

            <SupersetList
              supersets={orderedSupersets}
              isLoading={isSupersetLoading}
              draggedSupersetId={draggedSupersetId}
              dragOverSupersetId={dragOverSupersetId}
              loggedExercisesBySupersetId={loggedExercisesBySupersetId}
              draftSupersetNames={draftSupersetNames}
              onSupersetDragStart={handleSupersetDragStart}
              onSupersetDragEnd={() => {
                setDraggedSupersetId(null)
                setDragOverSupersetId(null)
              }}
              onSupersetDragOver={(event, supersetId) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = Array.from(
                  event.dataTransfer.types
                ).includes("application/x-exercise-id")
                  ? "copy"
                  : "move"
                setDragOverSupersetId(supersetId)
              }}
              onSupersetDragLeave={() => setDragOverSupersetId(null)}
              onSupersetDrop={handleSupersetDrop}
              onDraftSupersetNameChange={(supersetId, value) =>
                setDraftSupersetNames((currentNames) => ({
                  ...currentNames,
                  [supersetId]: value,
                }))
              }
              onSaveSupersetName={(supersetId, previousName) =>
                void saveSupersetName(supersetId, previousName)
              }
            />
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
      {loggedExerciseError ? (
        <p className="text-sm text-destructive">{loggedExerciseError}</p>
      ) : null}
      {loggedExerciseMutationError ? (
        <p className="text-sm text-destructive">{loggedExerciseMutationError}</p>
      ) : null}

      <AddSupersetDialog
        open={isAddSupersetDialogOpen}
        name={newSupersetName}
        isMutating={isSupersetMutating}
        onOpenChange={setIsAddSupersetDialogOpen}
        onNameChange={setNewSupersetName}
        onCreate={() => void handleCreateSuperset()}
      />
    </div>
  )
}
