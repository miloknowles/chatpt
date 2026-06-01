"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react"
import { generateKeyBetween } from "fractional-indexing"
import {
  ActivityIcon,
  GripVerticalIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUserProfile } from "@/hooks/use-user-profile"
import type {
  UserProfilePayload,
  UserQualityStateWithQuality,
} from "@/lib/redux/training-api"
import { cn } from "@/lib/utils"
import type {
  UserIssue,
  UserIssueStatus,
  UserQualityStatus,
} from "@/types/database"
import type { HookActionResult } from "@/hooks/rtk-query-utils"

type IssueFormValues = {
  name: string
  notes: string
  status: UserIssueStatus
}

type QualityFormValues = {
  name: string
  notes: string
  status: UserQualityStatus
  trainingFrequencyTarget: string
}

type AboutMeMode = "plaintext" | "rendered"
type AboutMeSaveStatus = "idle" | "saving" | "saved"

const ABOUT_ME_AUTOSAVE_DELAY_MS = 1200

const EMPTY_ISSUE_FORM: IssueFormValues = {
  name: "",
  notes: "",
  status: "active",
}

const EMPTY_QUALITY_FORM: QualityFormValues = {
  name: "",
  notes: "",
  status: "building",
  trainingFrequencyTarget: "",
}

function optionalText(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function issueToFormValues(issue: UserIssue): IssueFormValues {
  return {
    name: issue.name,
    notes: issue.notes ?? "",
    status: issue.status,
  }
}

function qualityToFormValues(
  qualityState: UserQualityStateWithQuality
): QualityFormValues {
  return {
    name: qualityState.quality.name,
    notes: qualityState.notes ?? "",
    status: qualityState.status,
    trainingFrequencyTarget: qualityState.training_frequency_target ?? "",
  }
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function statusVariant(status: string): "default" | "outline" | "secondary" {
  if (status === "active" || status === "building") {
    return "default"
  }
  if (status === "resolved" || status === "inactive") {
    return "outline"
  }
  return "secondary"
}

function selectClassName() {
  return "h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
}

type SortableProfileItem = {
  id: string
  sort_key: string | null
}

type DropPlacement = "before" | "after"

function getLastSortKey(items: SortableProfileItem[]) {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (items[index].sort_key) {
      return items[index].sort_key
    }
  }

  return null
}

function getPreviousSortKey(items: SortableProfileItem[], startIndex: number) {
  for (let index = startIndex; index >= 0; index -= 1) {
    if (items[index].sort_key) {
      return items[index].sort_key
    }
  }

  return null
}

function getNextSortKey(items: SortableProfileItem[], startIndex: number) {
  for (let index = startIndex; index < items.length; index += 1) {
    if (items[index].sort_key) {
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
  items: SortableProfileItem[],
  draggedItemId: string,
  targetItemId: string,
  placement: DropPlacement
) {
  const nextOrder = items.filter((item) => item.id !== draggedItemId)
  const targetIndex = nextOrder.findIndex((item) => item.id === targetItemId)

  if (targetIndex < 0) {
    return null
  }

  const previousKey =
    placement === "before"
      ? getPreviousSortKey(nextOrder, targetIndex - 1)
      : nextOrder[targetIndex]?.sort_key ??
        getPreviousSortKey(nextOrder, targetIndex - 1)
  const nextKey =
    placement === "before"
      ? nextOrder[targetIndex]?.sort_key ?? getNextSortKey(nextOrder, targetIndex)
      : getNextSortKey(nextOrder, targetIndex + 1)

  return generateKeyBetween(previousKey, nextKey)
}

function handleRowKeyboardOpen(
  event: KeyboardEvent<HTMLElement>,
  onOpen: () => void
) {
  if (event.key !== "Enter" && event.key !== " ") {
    return
  }

  event.preventDefault()
  onOpen()
}

function MarkdownPreview({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a({ children, href }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-2"
            >
              {children}
            </a>
          )
        },
        code({ children, className }) {
          const isBlock = className?.startsWith("language-")

          if (isBlock) {
            return (
              <code
                className={cn(
                  "block overflow-x-auto rounded bg-muted p-2 text-xs",
                  className
                )}
              >
                {children}
              </code>
            )
          }

          return (
            <code className="rounded bg-muted px-1 py-0.5 text-[0.85em]">
              {children}
            </code>
          )
        },
        h1({ children }) {
          return <h1 className="text-xl font-semibold">{children}</h1>
        },
        h2({ children }) {
          return <h2 className="text-lg font-semibold">{children}</h2>
        },
        h3({ children }) {
          return <h3 className="text-base font-semibold">{children}</h3>
        },
        ol({ children }) {
          return <ol className="list-decimal space-y-1 pl-5">{children}</ol>
        },
        ul({ children }) {
          return <ul className="list-disc space-y-1 pl-5">{children}</ul>
        },
        p({ children }) {
          return <p>{children}</p>
        },
        pre({ children }) {
          return <pre className="my-2 overflow-x-auto">{children}</pre>
        },
        table({ children }) {
          return (
            <div className="my-2 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-xs">
                {children}
              </table>
            </div>
          )
        },
        td({ children }) {
          return <td className="border border-border px-2 py-1">{children}</td>
        },
        th({ children }) {
          return (
            <th className="border border-border bg-muted px-2 py-1 font-medium">
              {children}
            </th>
          )
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

function AboutMeEditor({
  initialAboutMe,
  isLoading,
  updateUserProfile,
}: {
  initialAboutMe: string
  isLoading: boolean
  updateUserProfile: (payload: UserProfilePayload) => HookActionResult
}) {
  const [aboutMe, setAboutMe] = useState(initialAboutMe)
  const [isAboutMeDirty, setIsAboutMeDirty] = useState(false)
  const [aboutMeError, setAboutMeError] = useState<string | null>(null)
  const [aboutMeMode, setAboutMeMode] = useState<AboutMeMode>("plaintext")
  const [saveStatus, setSaveStatus] = useState<AboutMeSaveStatus>("idle")
  const savedAboutMeRef = useRef(initialAboutMe)
  const latestAboutMeRef = useRef(initialAboutMe)
  const saveRequestIdRef = useRef(0)
  const hasAboutMe = aboutMe.trim().length > 0

  const saveAboutMe = useCallback(
    async (value: string) => {
      if (value === savedAboutMeRef.current) {
        setIsAboutMeDirty(false)
        setSaveStatus("saved")
        return
      }

      const saveRequestId = saveRequestIdRef.current + 1
      saveRequestIdRef.current = saveRequestId
      setAboutMeError(null)
      setSaveStatus("saving")

      const result = await updateUserProfile({
        about_me: value,
      })

      if (saveRequestId !== saveRequestIdRef.current) {
        return
      }

      if (result.error) {
        setAboutMeError(result.error)
        setSaveStatus("idle")
        return
      }

      savedAboutMeRef.current = value
      setIsAboutMeDirty(latestAboutMeRef.current !== value)
      setSaveStatus("saved")
    },
    [updateUserProfile]
  )

  useEffect(() => {
    if (!isAboutMeDirty) {
      return
    }

    const autosaveTimer = window.setTimeout(() => {
      void saveAboutMe(aboutMe)
    }, ABOUT_ME_AUTOSAVE_DELAY_MS)

    return () => {
      window.clearTimeout(autosaveTimer)
    }
  }, [aboutMe, isAboutMeDirty, saveAboutMe])

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="min-w-0 font-heading text-base font-medium">
          About Me
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {isLoading
              ? "Loading..."
              : saveStatus === "saving"
              ? "Saving..."
              : saveStatus === "saved"
                ? "Saved"
                : isAboutMeDirty
                  ? "Unsaved"
                  : ""}
          </p>
          <div className="inline-flex rounded-md border border-border bg-background p-0.5 shadow-xs">
            <Button
              type="button"
              variant={aboutMeMode === "plaintext" ? "secondary" : "ghost"}
              size="sm"
              aria-pressed={aboutMeMode === "plaintext"}
              onClick={() => setAboutMeMode("plaintext")}
              className="h-7 px-2 text-xs"
            >
              Edit
            </Button>
            <Button
              type="button"
              variant={aboutMeMode === "rendered" ? "secondary" : "ghost"}
              size="sm"
              aria-pressed={aboutMeMode === "rendered"}
              onClick={() => setAboutMeMode("rendered")}
              className="h-7 px-2 text-xs"
            >
              Preview
            </Button>
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="relative">
          <Textarea
            value=""
            disabled
            placeholder="Loading profile..."
            className="min-h-32 resize-y bg-background pr-10"
          />
          <LoaderCircleIcon className="absolute right-3 top-3 size-4 animate-spin text-muted-foreground" />
        </div>
      ) : aboutMeMode === "plaintext" ? (
        <Textarea
          value={aboutMe}
          onChange={(event) => {
            const nextValue = event.target.value
            setAboutMe(nextValue)
            latestAboutMeRef.current = nextValue
            setIsAboutMeDirty(nextValue !== savedAboutMeRef.current)
            setSaveStatus("idle")
            setAboutMeError(null)
          }}
          onBlur={(event) => {
            void saveAboutMe(event.target.value)
          }}
          placeholder="Training background, goals, constraints, and context"
          className="min-h-32 resize-y bg-background"
        />
      ) : (
        <div className="min-h-32 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs">
          {hasAboutMe ? (
            <div className="space-y-2 leading-6">
              <MarkdownPreview content={aboutMe} />
            </div>
          ) : (
            <p className="text-muted-foreground">No about me yet.</p>
          )}
        </div>
      )}
      {aboutMeError ? (
        <p className="text-sm text-destructive">{aboutMeError}</p>
      ) : null}
    </section>
  )
}

export function ProfileManager() {
  const {
    issues,
    qualityStates,
    userProfile,
    isLoading,
    isUserProfileLoading,
    isMutating,
    error,
    mutationError,
    createIssue,
    updateIssue,
    reorderIssue,
    updateUserProfile,
    updateQuality,
    createQualityState,
    updateQualityState,
    reorderQualityState,
    deleteQualityState,
  } = useUserProfile()

  const [isEditingIssue, setIsEditingIssue] = useState(false)
  const [isEditingQuality, setIsEditingQuality] = useState(false)
  const [editingIssue, setEditingIssue] = useState<UserIssue | null>(null)
  const [editingQuality, setEditingQuality] =
    useState<UserQualityStateWithQuality | null>(null)
  const [issueForm, setIssueForm] = useState<IssueFormValues>(EMPTY_ISSUE_FORM)
  const [qualityForm, setQualityForm] =
    useState<QualityFormValues>(EMPTY_QUALITY_FORM)
  const [issueFormError, setIssueFormError] = useState<string | null>(null)
  const [qualityFormError, setQualityFormError] = useState<string | null>(null)
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null)
  const [dragOverIssueId, setDragOverIssueId] = useState<string | null>(null)
  const [issueDropPlacement, setIssueDropPlacement] =
    useState<DropPlacement>("before")
  const [draggedQualityId, setDraggedQualityId] = useState<string | null>(null)
  const [dragOverQualityId, setDragOverQualityId] = useState<string | null>(
    null
  )
  const [qualityDropPlacement, setQualityDropPlacement] =
    useState<DropPlacement>("before")

  function openNewIssueForm() {
    setEditingIssue(null)
    setIssueForm(EMPTY_ISSUE_FORM)
    setIssueFormError(null)
    setIsEditingIssue(true)
  }

  function openEditIssueForm(issue: UserIssue) {
    setEditingIssue(issue)
    setIssueForm(issueToFormValues(issue))
    setIssueFormError(null)
    setIsEditingIssue(true)
  }

  function closeIssueForm() {
    setIsEditingIssue(false)
    setEditingIssue(null)
    setIssueForm(EMPTY_ISSUE_FORM)
    setIssueFormError(null)
  }

  function openNewQualityForm() {
    setEditingQuality(null)
    setQualityForm(EMPTY_QUALITY_FORM)
    setQualityFormError(null)
    setIsEditingQuality(true)
  }

  function openEditQualityForm(quality: UserQualityStateWithQuality) {
    setEditingQuality(quality)
    setQualityForm(qualityToFormValues(quality))
    setQualityFormError(null)
    setIsEditingQuality(true)
  }

  function closeQualityForm() {
    setIsEditingQuality(false)
    setEditingQuality(null)
    setQualityForm(EMPTY_QUALITY_FORM)
    setQualityFormError(null)
  }

  async function handleIssueSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIssueFormError(null)

    const name = issueForm.name.trim()
    if (!name) {
      setIssueFormError("Name is required.")
      return
    }

    const payload = {
      name,
      notes: optionalText(issueForm.notes),
      status: issueForm.status,
      sort_key: editingIssue
        ? editingIssue.sort_key
        : generateKeyBetween(getLastSortKey(issues), null),
    }
    const result = editingIssue
      ? await updateIssue(editingIssue.id, payload)
      : await createIssue(payload)

    if (result.error) {
      setIssueFormError(result.error)
      return
    }

    closeIssueForm()
  }

  async function handleQualitySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setQualityFormError(null)

    const name = qualityForm.name.trim()
    if (!name) {
      setQualityFormError("Name is required.")
      return
    }

    const payload = {
      name,
      notes: optionalText(qualityForm.notes),
      status: qualityForm.status,
      training_frequency_target: optionalText(
        qualityForm.trainingFrequencyTarget
      ),
      sort_key: editingQuality
        ? editingQuality.sort_key
        : generateKeyBetween(getLastSortKey(qualityStates), null),
    }
    if (editingQuality && editingQuality.quality.name !== name) {
      const qualityResult = await updateQuality(editingQuality.quality.id, {
        name,
        notes: editingQuality.quality.notes,
        body_region_id: editingQuality.quality.body_region_id,
        display_color: editingQuality.quality.display_color,
        sort_key: editingQuality.quality.sort_key,
      })

      if (qualityResult.error) {
        setQualityFormError(qualityResult.error)
        return
      }
    }

    const result = editingQuality
      ? await updateQualityState(editingQuality.id, {
          status: payload.status,
          training_frequency_target: payload.training_frequency_target,
          notes: payload.notes,
        })
      : await createQualityState(payload)

    if (result.error) {
      setQualityFormError(result.error)
      return
    }

    closeQualityForm()
  }

  async function handleRemoveQualityFromProfile() {
    if (!editingQuality) {
      return
    }

    const result = await deleteQualityState(editingQuality.id)
    if (result.error) {
      setQualityFormError(result.error)
      return
    }

    closeQualityForm()
  }

  function handleIssueDragStart(
    event: DragEvent<HTMLButtonElement>,
    issueId: string
  ) {
    event.stopPropagation()
    setDraggedIssueId(issueId)
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("application/x-profile-issue-id", issueId)
  }

  function handleIssueDrop(
    event: DragEvent<HTMLElement>,
    targetIssueId: string
  ) {
    event.preventDefault()

    const droppedIssueId =
      draggedIssueId ||
      event.dataTransfer.getData("application/x-profile-issue-id")

    if (!droppedIssueId || droppedIssueId === targetIssueId) {
      setDraggedIssueId(null)
      setDragOverIssueId(null)
      setIssueDropPlacement("before")
      return
    }

    const sortKey = getSortKeyForDrop(
      issues,
      droppedIssueId,
      targetIssueId,
      getDropPlacement(event)
    )
    if (sortKey) {
      void reorderIssue(droppedIssueId, sortKey)
    }

    setDraggedIssueId(null)
    setDragOverIssueId(null)
    setIssueDropPlacement("before")
  }

  function handleQualityDragStart(
    event: DragEvent<HTMLButtonElement>,
    qualityId: string
  ) {
    event.stopPropagation()
    setDraggedQualityId(qualityId)
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("application/x-profile-quality-id", qualityId)
  }

  function handleQualityDrop(
    event: DragEvent<HTMLElement>,
    targetQualityId: string
  ) {
    event.preventDefault()

    const droppedQualityId =
      draggedQualityId ||
      event.dataTransfer.getData("application/x-profile-quality-id")

    if (!droppedQualityId || droppedQualityId === targetQualityId) {
      setDraggedQualityId(null)
      setDragOverQualityId(null)
      setQualityDropPlacement("before")
      return
    }

    const sortKey = getSortKeyForDrop(
      qualityStates,
      droppedQualityId,
      targetQualityId,
      getDropPlacement(event)
    )
    if (sortKey) {
      void reorderQualityState(droppedQualityId, sortKey)
    }

    setDraggedQualityId(null)
    setDragOverQualityId(null)
    setQualityDropPlacement("before")
  }

  return (
    <div className="min-h-0 space-y-4">
      <AboutMeEditor
        key={userProfile?.updated_at ?? "empty-profile"}
        initialAboutMe={userProfile?.about_me ?? ""}
        isLoading={isUserProfileLoading}
        updateUserProfile={updateUserProfile}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                <ActivityIcon className="size-4" />
              </div>
              <div className="min-w-0">
                <h2 className="font-heading text-base font-medium">Issues</h2>
                <p className="text-sm text-muted-foreground">
                  Problems and limitations you&apos;re working on
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              aria-label={isEditingIssue ? "Close issue form" : "Add issue"}
              onClick={isEditingIssue ? closeIssueForm : openNewIssueForm}
            >
              {isEditingIssue ? <XIcon /> : <PlusIcon />}
            </Button>
          </div>

          <div className="space-y-3">
            {isEditingIssue ? (
              <form
                className="rounded-md border border-border/70 bg-muted/20 p-3"
                onSubmit={handleIssueSubmit}
              >
                <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                  <div className="space-y-2">
                    <Label htmlFor="issue-name">Issue</Label>
                    <Input
                      id="issue-name"
                      value={issueForm.name}
                      maxLength={120}
                      placeholder="Left knee valgus"
                      onChange={(event) =>
                        setIssueForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issue-status">Status</Label>
                    <select
                      id="issue-status"
                      className={selectClassName()}
                      value={issueForm.status}
                      onChange={(event) =>
                        setIssueForm((current) => ({
                          ...current,
                          status: event.target.value as UserIssueStatus,
                        }))
                      }
                    >
                      <option value="active">Active</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <Label htmlFor="issue-notes">Notes</Label>
                  <Textarea
                    id="issue-notes"
                    value={issueForm.notes}
                    placeholder="Triggers, context, current plan"
                    onChange={(event) =>
                      setIssueForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </div>
                {issueFormError || mutationError ? (
                  <p className="mt-3 text-sm text-destructive">
                    {issueFormError ?? mutationError}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  size="sm"
                  className="mt-3"
                  disabled={isMutating}
                >
                  {editingIssue ? <PencilIcon /> : <PlusIcon />}
                  {isMutating
                    ? "Saving..."
                    : editingIssue
                      ? "Save Issue"
                      : "Add Issue"}
                </Button>
              </form>
            ) : null}

            {isLoading ? (
              <p className="rounded-md border border-border/70 p-3 text-sm text-muted-foreground">
                Loading issues...
              </p>
            ) : error ? (
              <p className="rounded-md border border-destructive/30 p-3 text-sm text-destructive">
                {error}
              </p>
            ) : issues.length === 0 ? (
              <p className="rounded-md border border-border/70 p-3 text-sm text-muted-foreground">
                No issues yet.
              </p>
            ) : (
              <div className="space-y-2">
                {issues.map((issue) => (
                  <article
                    key={issue.id}
                    role="button"
                    tabIndex={0}
                    onDragOver={(event) => {
                      event.preventDefault()
                      setDragOverIssueId(issue.id)
                      setIssueDropPlacement(getDropPlacement(event))
                    }}
                    onDragLeave={() => {
                      setDragOverIssueId(null)
                      setIssueDropPlacement("before")
                    }}
                    onDrop={(event) => handleIssueDrop(event, issue.id)}
                    onClick={() => openEditIssueForm(issue)}
                    onKeyDown={(event) =>
                      handleRowKeyboardOpen(event, () => openEditIssueForm(issue))
                    }
                    className={cn(
                      "w-full rounded-md border border-border/70 p-3 text-left transition-colors hover:bg-muted/40",
                      draggedIssueId === issue.id && "opacity-50",
                      dragOverIssueId === issue.id && "bg-muted/30",
                      dragOverIssueId === issue.id &&
                        issueDropPlacement === "before" &&
                        "border-t-primary",
                      dragOverIssueId === issue.id &&
                        issueDropPlacement === "after" &&
                        "border-b-primary"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        draggable
                        className="mt-0.5 flex size-7 shrink-0 cursor-grab items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
                        aria-label={`Reorder ${issue.name}`}
                        onClick={(event) => event.stopPropagation()}
                        onDragStart={(event) =>
                          handleIssueDragStart(event, issue.id)
                        }
                        onDragEnd={() => {
                          setDraggedIssueId(null)
                          setDragOverIssueId(null)
                          setIssueDropPlacement("before")
                        }}
                      >
                        <GripVerticalIcon className="size-4" />
                      </button>
                      <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {issue.name}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {issue.notes ?? "No notes yet."}
                          </p>
                        </div>
                        <Badge variant={statusVariant(issue.status)}>
                          {formatStatus(issue.status)}
                        </Badge>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <SparklesIcon className="size-4" />
              </div>
              <div className="min-w-0">
                <h2 className="font-heading text-base font-medium">Qualities</h2>
                <p className="text-sm text-muted-foreground">
                  Capabilities you&apos;re building or maintaining
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              aria-label={
                isEditingQuality ? "Close quality form" : "Add quality"
              }
              onClick={
                isEditingQuality ? closeQualityForm : openNewQualityForm
              }
            >
              {isEditingQuality ? <XIcon /> : <PlusIcon />}
            </Button>
          </div>

          <div className="space-y-3">
            {isEditingQuality ? (
              <form
                className="rounded-md border border-border/70 bg-muted/20 p-3"
                onSubmit={handleQualitySubmit}
              >
                <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
                  <div className="space-y-2">
                    <Label htmlFor="quality-name">Quality</Label>
                    <Input
                      id="quality-name"
                      value={qualityForm.name}
                      maxLength={120}
                      placeholder="Ankle dorsiflexion control"
                      onChange={(event) =>
                        setQualityForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quality-status">Status</Label>
                    <select
                      id="quality-status"
                      className={selectClassName()}
                      value={qualityForm.status}
                      onChange={(event) =>
                        setQualityForm((current) => ({
                          ...current,
                          status: event.target.value as UserQualityStatus,
                        }))
                      }
                    >
                      <option value="building">Building</option>
                      <option value="maintaining">Maintaining</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <Label htmlFor="quality-target">Frequency Target</Label>
                  <Input
                    id="quality-target"
                    value={qualityForm.trainingFrequencyTarget}
                    maxLength={120}
                    placeholder="Daily warmup exposure"
                    onChange={(event) =>
                      setQualityForm((current) => ({
                        ...current,
                        trainingFrequencyTarget: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="mt-3 space-y-2">
                  <Label htmlFor="quality-notes">Notes</Label>
                  <Textarea
                    id="quality-notes"
                    value={qualityForm.notes}
                    placeholder="Progression notes, constraints, and cues"
                    onChange={(event) =>
                      setQualityForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </div>
                {qualityFormError || mutationError ? (
                  <p className="mt-3 text-sm text-destructive">
                    {qualityFormError ?? mutationError}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="submit" size="sm" disabled={isMutating}>
                    {editingQuality ? <PencilIcon /> : <PlusIcon />}
                    {isMutating
                      ? "Saving..."
                      : editingQuality
                        ? "Save Quality"
                        : "Add Quality"}
                  </Button>
                  {editingQuality ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isMutating}
                      onClick={() => {
                        void handleRemoveQualityFromProfile()
                      }}
                    >
                      <Trash2Icon />
                      Remove from Profile
                    </Button>
                  ) : null}
                </div>
              </form>
            ) : null}

            {isLoading ? (
              <p className="rounded-md border border-border/70 p-3 text-sm text-muted-foreground">
                Loading qualities...
              </p>
            ) : error ? (
              <p className="rounded-md border border-destructive/30 p-3 text-sm text-destructive">
                {error}
              </p>
            ) : qualityStates.length === 0 ? (
              <p className="rounded-md border border-border/70 p-3 text-sm text-muted-foreground">
                No qualities yet.
              </p>
            ) : (
              <div className="space-y-2">
                {qualityStates.map((quality) => (
                  <article
                    key={quality.id}
                    role="button"
                    tabIndex={0}
                    onDragOver={(event) => {
                      event.preventDefault()
                      setDragOverQualityId(quality.id)
                      setQualityDropPlacement(getDropPlacement(event))
                    }}
                    onDragLeave={() => {
                      setDragOverQualityId(null)
                      setQualityDropPlacement("before")
                    }}
                    onDrop={(event) => handleQualityDrop(event, quality.id)}
                    onClick={() => openEditQualityForm(quality)}
                    onKeyDown={(event) =>
                      handleRowKeyboardOpen(event, () =>
                        openEditQualityForm(quality)
                      )
                    }
                    className={cn(
                      "w-full rounded-md border border-border/70 p-3 text-left transition-colors hover:bg-muted/40",
                      draggedQualityId === quality.id && "opacity-50",
                      dragOverQualityId === quality.id && "bg-muted/30",
                      dragOverQualityId === quality.id &&
                        qualityDropPlacement === "before" &&
                        "border-t-primary",
                      dragOverQualityId === quality.id &&
                        qualityDropPlacement === "after" &&
                        "border-b-primary"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        draggable
                        className="mt-0.5 flex size-7 shrink-0 cursor-grab items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
                        aria-label={`Reorder ${quality.quality.name}`}
                        onClick={(event) => event.stopPropagation()}
                        onDragStart={(event) =>
                          handleQualityDragStart(event, quality.id)
                        }
                        onDragEnd={() => {
                          setDraggedQualityId(null)
                          setDragOverQualityId(null)
                          setQualityDropPlacement("before")
                        }}
                      >
                        <GripVerticalIcon className="size-4" />
                      </button>
                      <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {quality.quality.name}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {quality.training_frequency_target ??
                              "No target yet."}
                          </p>
                        </div>
                        <Badge variant={statusVariant(quality.status)}>
                          {formatStatus(quality.status)}
                        </Badge>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
