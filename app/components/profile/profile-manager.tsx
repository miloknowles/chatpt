"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react"
import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing"
import {
  ActivityIcon,
  AlertCircleIcon,
  ChartSplineIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleSlashIcon,
  ClockIcon,
  FlagIcon,
  GripVerticalIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlusIcon,
  Repeat2Icon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { Badge } from "@/components/ui/badge"
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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getTaxonomyColorDotClass } from "@/components/exercises/taxonomy-colors"
import { useUserProfile } from "@/hooks/use-user-profile"
import type {
  UserProfilePayload,
  UserQualityStateWithQuality,
} from "@/lib/redux/training-api"
import { cn } from "@/lib/utils"
import type {
  UserIssue,
  UserIssuePriority,
  UserIssueStatus,
  UserQuality,
  UserQualityFrequencyPeriod,
  UserQualityStatus,
} from "@/types/database"
import type { HookActionResult } from "@/hooks/rtk-query-utils"

type IssueFormValues = {
  name: string
  notes: string
  priority: UserIssuePriority | null
  status: UserIssueStatus
}

type QualityFormValues = {
  name: string
  notes: string
  status: UserQualityStatus
  frequencyCount: number | null
  frequencyPeriod: UserQualityFrequencyPeriod | null
  frequencyMode: FrequencyTargetMode
}

type AboutMeMode = "plaintext" | "rendered"
type AboutMeSaveStatus = "idle" | "saving" | "saved"
type FrequencyTargetMode =
  | "none"
  | "daily"
  | "weekly"
  | "twice_weekly"
  | "three_times_weekly"
  | "custom"

const ABOUT_ME_AUTOSAVE_DELAY_MS = 1200

const EMPTY_ISSUE_FORM: IssueFormValues = {
  name: "",
  notes: "",
  priority: null,
  status: "active",
}

const EMPTY_QUALITY_FORM: QualityFormValues = {
  name: "",
  notes: "",
  status: "building",
  frequencyCount: null,
  frequencyPeriod: null,
  frequencyMode: "none",
}

const FREQUENCY_COUNTS = [1, 2, 3, 4, 5, 6, 7] as const
const FREQUENCY_PERIOD_OPTIONS: {
  value: UserQualityFrequencyPeriod
  label: string
}[] = [
  { value: "day", label: "per day" },
  { value: "week", label: "per week" },
]

function optionalText(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function formatFrequencyTarget(
  count: number | null,
  period: UserQualityFrequencyPeriod | null
) {
  if (count === null || period === null) {
    return null
  }

  if (period === "day" && count === 1) {
    return "Daily"
  }

  if (period === "week" && count === 1) {
    return "Weekly"
  }

  return `${count}x/${period}`
}

function getFrequencyTargetMode(
  count: number | null,
  period: UserQualityFrequencyPeriod | null
): FrequencyTargetMode {
  if (count === null || period === null) {
    return "none"
  }

  if (period === "day" && count === 1) {
    return "daily"
  }

  if (period === "week" && count === 1) {
    return "weekly"
  }

  if (period === "week" && count === 2) {
    return "twice_weekly"
  }

  if (period === "week" && count === 3) {
    return "three_times_weekly"
  }

  return "custom"
}

function getQualityFrequencyLabel(qualityState: UserQualityStateWithQuality) {
  return (
    formatFrequencyTarget(
      qualityState.training_frequency_count,
      qualityState.training_frequency_period
    ) ?? "No target yet."
  )
}

function issueToFormValues(issue: UserIssue): IssueFormValues {
  return {
    name: issue.name,
    notes: issue.notes ?? "",
    priority: issue.priority,
    status: issue.status,
  }
}

function formatPriority(priority: UserIssuePriority) {
  return priority.charAt(0).toUpperCase() + priority.slice(1)
}

function qualityToFormValues(
  qualityState: UserQualityStateWithQuality
): QualityFormValues {
  return {
    name: qualityState.quality.name,
    notes: qualityState.notes ?? "",
    status: qualityState.status,
    frequencyCount: qualityState.training_frequency_count,
    frequencyPeriod: qualityState.training_frequency_period,
    frequencyMode: getFrequencyTargetMode(
      qualityState.training_frequency_count,
      qualityState.training_frequency_period
    ),
  }
}

function formatStatus(status: string) {
  if (status === "building") {
    return "Build"
  }

  if (status === "maintaining") {
    return "Maintain"
  }

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function statusVariant(status: string): "default" | "outline" | "secondary" {
  if (status === "building") {
    return "default"
  }
  if (status === "active" || status === "resolved" || status === "inactive") {
    return "outline"
  }
  return "secondary"
}

function statusClassName(status: string) {
  if (status === "active") {
    return "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300"
  }
  if (status === "resolved") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  }
  if (status === "building") {
    return "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300"
  }
  if (status === "maintaining") {
    return "border-muted-foreground/25 bg-muted text-muted-foreground"
  }
  return undefined
}

function renderStatusIcon(status: string) {
  if (status === "active") {
    return <AlertCircleIcon data-icon="inline-start" />
  }
  if (status === "resolved") {
    return <CheckCircle2Icon data-icon="inline-start" />
  }
  if (status === "building") {
    return <ChartSplineIcon data-icon="inline-start" />
  }
  if (status === "maintaining") {
    return <Repeat2Icon data-icon="inline-start" />
  }
  if (status === "inactive") {
    return <CircleSlashIcon data-icon="inline-start" />
  }
  return <ActivityIcon data-icon="inline-start" />
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={statusVariant(status)} className={statusClassName(status)}>
      {renderStatusIcon(status)}
      {formatStatus(status)}
    </Badge>
  )
}

function priorityClassName(priority: UserIssuePriority) {
  if (priority === "high") {
    return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
  }
  if (priority === "medium") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
  }
  return "border-muted-foreground/25 bg-background text-muted-foreground"
}

function PriorityBadge({ priority }: { priority: UserIssuePriority }) {
  return (
    <Badge variant="outline" className={priorityClassName(priority)}>
      <FlagIcon data-icon="inline-start" />
      {formatPriority(priority)}
    </Badge>
  )
}

function FrequencyBadge({
  qualityState,
}: {
  qualityState: UserQualityStateWithQuality
}) {
  return (
    <Badge
      variant="outline"
      className="border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
    >
      <ClockIcon data-icon="inline-start" />
      {getQualityFrequencyLabel(qualityState)}
    </Badge>
  )
}

function ExistingQualityPicker({
  qualities,
  selectedQualityId,
  query,
  onQueryChange,
  onSelect,
}: {
  qualities: UserQuality[]
  selectedQualityId: string | null
  query: string
  onQueryChange: (query: string) => void
  onSelect: (quality: UserQuality) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedQuality = selectedQualityId
    ? qualities.find((quality) => quality.id === selectedQualityId) ?? null
    : null
  const normalizedQuery = query.trim().toLowerCase()
  const filteredQualities = qualities.filter((quality) =>
    quality.name.toLowerCase().includes(normalizedQuery)
  )

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between"
          />
        }
      >
        <span className="truncate">
          {selectedQuality?.name ?? "Select existing quality"}
        </span>
        <ChevronDownIcon data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <div className="px-2 pb-1">
          <Input
            value={query}
            placeholder="Search qualities"
            onChange={(event) => onQueryChange(event.target.value)}
            onPointerDown={(event) => event.stopPropagation()}
            onKeyDownCapture={(event) => event.stopPropagation()}
          />
        </div>
        <DropdownMenuSeparator />
        {filteredQualities.length > 0 ? (
          filteredQualities.map((quality) => (
            <DropdownMenuItem
              key={quality.id}
              onClick={(event) => {
                event.preventDefault()
                onSelect(quality)
                setIsOpen(false)
              }}
            >
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full border border-border",
                  getTaxonomyColorDotClass(quality.display_color)
                )}
                aria-hidden="true"
              />
              <span className="truncate">{quality.name}</span>
            </DropdownMenuItem>
          ))
        ) : (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No matching qualities
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DropdownSelect<TValue extends string | null>({
  id,
  value,
  options,
  onChange,
  ariaLabel,
}: {
  id?: string
  value: TValue
  options: { value: TValue; label: string }[]
  onChange: (value: TValue) => void
  ariaLabel?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0]

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            className="w-full justify-between"
            aria-label={ariaLabel}
          />
        }
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDownIcon data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value ?? "none"}
            onClick={(event) => {
              event.preventDefault()
              onChange(option.value)
              setIsOpen(false)
            }}
          >
            <span className="truncate">{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function FrequencyTargetInput({
  count,
  period,
  mode,
  onChange,
}: {
  count: number | null
  period: UserQualityFrequencyPeriod | null
  mode: FrequencyTargetMode
  onChange: (
    count: number | null,
    period: UserQualityFrequencyPeriod | null,
    mode: FrequencyTargetMode
  ) => void
}) {
  const customCount = count ?? 2
  const customPeriod = period ?? "week"

  return (
    <div className="space-y-2">
      <DropdownSelect
        id="quality-target"
        value={mode}
        options={[
          { value: "none", label: "No target" },
          { value: "daily", label: "Daily" },
          { value: "weekly", label: "Weekly" },
          { value: "twice_weekly", label: "2x/week" },
          { value: "three_times_weekly", label: "3x/week" },
          { value: "custom", label: "Custom" },
        ]}
        onChange={(nextMode) => {
          if (nextMode === "none") {
            onChange(null, null, nextMode)
            return
          }

          if (nextMode === "daily") {
            onChange(1, "day", nextMode)
            return
          }

          if (nextMode === "weekly") {
            onChange(1, "week", nextMode)
            return
          }

          if (nextMode === "twice_weekly") {
            onChange(2, "week", nextMode)
            return
          }

          if (nextMode === "three_times_weekly") {
            onChange(3, "week", nextMode)
            return
          }

          onChange(2, "week", nextMode)
        }}
      />
      {mode === "custom" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <DropdownSelect
            ariaLabel="Times"
            value={String(customCount)}
            options={FREQUENCY_COUNTS.map((option) => ({
              value: String(option),
              label: `${option}x`,
            }))}
            onChange={(nextCount) =>
              onChange(Number(nextCount), customPeriod, "custom")
            }
          />
          <DropdownSelect
            ariaLabel="Period"
            value={customPeriod}
            options={FREQUENCY_PERIOD_OPTIONS}
            onChange={(nextPeriod) =>
              onChange(customCount, nextPeriod, "custom")
            }
          />
        </div>
      ) : null}
    </div>
  )
}

type SortableProfileItem = {
  id: string
  sort_key: string | null
}

type DropPlacement = "before" | "after"

function getLastSortKey(items: SortableProfileItem[]) {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (isValidSortKey(items[index].sort_key)) {
      return items[index].sort_key
    }
  }

  return null
}

function getPreviousSortKey(items: SortableProfileItem[], startIndex: number) {
  for (let index = startIndex; index >= 0; index -= 1) {
    if (isValidSortKey(items[index].sort_key)) {
      return items[index].sort_key
    }
  }

  return null
}

function getNextSortKey(items: SortableProfileItem[], startIndex: number) {
  for (let index = startIndex; index < items.length; index += 1) {
    if (isValidSortKey(items[index].sort_key)) {
      return items[index].sort_key
    }
  }

  return null
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

function getItemsForDrop<TItem extends SortableProfileItem>(
  items: TItem[],
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

function hasUnusableSortKeys(items: SortableProfileItem[]) {
  const seenSortKeys = new Set<string>()
  let previousSortKey: string | null = null

  return items.some((item) => {
    const sortKey = item.sort_key
    if (!sortKey || !isValidSortKey(sortKey) || seenSortKeys.has(sortKey)) {
      return true
    }

    if (previousSortKey) {
      try {
        generateKeyBetween(previousSortKey, sortKey)
      } catch {
        return true
      }
    }

    seenSortKeys.add(sortKey)
    previousSortKey = sortKey
    return false
  })
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
    qualities,
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
    deleteIssue,
    updateUserProfile,
    updateQuality,
    createQualityState,
    updateQualityState,
    reorderQualityState,
  } = useUserProfile()

  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false)
  const [isQualityDialogOpen, setIsQualityDialogOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState<UserIssue | null>(null)
  const [pendingDeleteIssue, setPendingDeleteIssue] =
    useState<UserIssue | null>(null)
  const [deleteIssueError, setDeleteIssueError] = useState<string | null>(null)
  const [editingQuality, setEditingQuality] =
    useState<UserQualityStateWithQuality | null>(null)
  const [issueForm, setIssueForm] = useState<IssueFormValues>(EMPTY_ISSUE_FORM)
  const [qualityForm, setQualityForm] =
    useState<QualityFormValues>(EMPTY_QUALITY_FORM)
  const [selectedQualityId, setSelectedQualityId] = useState<string | null>(
    null
  )
  const [qualityPickerQuery, setQualityPickerQuery] = useState("")
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
  const availableQualities = useMemo(() => {
    const visibleQualityIds = new Set(
      qualityStates.map((qualityState) => qualityState.quality.id)
    )

    return qualities.filter((quality) => !visibleQualityIds.has(quality.id))
  }, [qualities, qualityStates])

  function resetQualityPicker() {
    setSelectedQualityId(null)
    setQualityPickerQuery("")
  }

  function getFrequencyTargetPayload() {
    return {
      training_frequency_count: qualityForm.frequencyCount,
      training_frequency_period: qualityForm.frequencyPeriod,
    }
  }

  function openNewIssueForm() {
    setEditingIssue(null)
    setIssueForm(EMPTY_ISSUE_FORM)
    setIssueFormError(null)
    setIsIssueDialogOpen(true)
  }

  function openEditIssueForm(issue: UserIssue) {
    setEditingIssue(issue)
    setIssueForm(issueToFormValues(issue))
    setIssueFormError(null)
    setIsIssueDialogOpen(true)
  }

  function closeIssueForm() {
    setIsIssueDialogOpen(false)
    setEditingIssue(null)
    setIssueForm(EMPTY_ISSUE_FORM)
    setIssueFormError(null)
  }

  function openNewQualityForm() {
    setEditingQuality(null)
    setQualityForm(EMPTY_QUALITY_FORM)
    resetQualityPicker()
    setQualityFormError(null)
    setIsQualityDialogOpen(true)
  }

  function openEditQualityForm(quality: UserQualityStateWithQuality) {
    setEditingQuality(quality)
    setQualityForm(qualityToFormValues(quality))
    resetQualityPicker()
    setQualityFormError(null)
    setIsQualityDialogOpen(true)
  }

  function closeQualityForm() {
    setIsQualityDialogOpen(false)
    setEditingQuality(null)
    setQualityForm(EMPTY_QUALITY_FORM)
    resetQualityPicker()
    setQualityFormError(null)
  }

  function handleIssueDialogOpenChange(open: boolean) {
    if (open) {
      setIsIssueDialogOpen(true)
      return
    }

    closeIssueForm()
  }

  function handleQualityDialogOpenChange(open: boolean) {
    if (open) {
      setIsQualityDialogOpen(true)
      return
    }

    closeQualityForm()
  }

  function handleDeleteIssueDialogOpenChange(open: boolean) {
    if (!open) {
      setPendingDeleteIssue(null)
      setDeleteIssueError(null)
    }
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
      priority: issueForm.priority,
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

  async function handleDeleteIssue() {
    if (!pendingDeleteIssue) {
      return
    }

    setDeleteIssueError(null)
    const result = await deleteIssue(pendingDeleteIssue.id)
    if (result.error) {
      setDeleteIssueError(result.error)
      return
    }

    setPendingDeleteIssue(null)
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

    const frequencyTargetPayload = getFrequencyTargetPayload()
    const payload = {
      quality_id: selectedQualityId,
      name,
      notes: optionalText(qualityForm.notes),
      status: qualityForm.status,
      ...frequencyTargetPayload,
      sort_key: editingQuality
        ? editingQuality.sort_key
        : generateKeyBetween(getLastSortKey(qualityStates), null),
    }
    if (editingQuality && editingQuality.quality.name !== name) {
      const qualityResult = await updateQuality(editingQuality.quality.id, {
        name,
        description: editingQuality.quality.description,
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
          training_frequency_count: payload.training_frequency_count,
          training_frequency_period: payload.training_frequency_period,
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

    const frequencyTargetPayload = getFrequencyTargetPayload()
    const result = await updateQualityState(editingQuality.id, {
      status: "inactive",
      ...frequencyTargetPayload,
      notes: optionalText(qualityForm.notes),
    })
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

  async function reindexIssues(issuesToIndex: UserIssue[]) {
    const sortKeys = generateNKeysBetween(null, null, issuesToIndex.length)
    const results = await Promise.all(
      issuesToIndex.map((issue, index) =>
        reorderIssue(issue.id, sortKeys[index])
      )
    )

    return results.find((result) => result.error)?.error ?? null
  }

  async function reindexQualityStates(
    qualityStatesToIndex: UserQualityStateWithQuality[]
  ) {
    const sortKeys = generateNKeysBetween(null, null, qualityStatesToIndex.length)
    const results = await Promise.all(
      qualityStatesToIndex.map((qualityState, index) =>
        reorderQualityState(qualityState.id, sortKeys[index])
      )
    )

    return results.find((result) => result.error)?.error ?? null
  }

  async function handleIssueDrop(
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

    const placement = getDropPlacement(event)
    const sortKey = getSortKeyForDrop(
      issues,
      droppedIssueId,
      targetIssueId,
      placement
    )
    if (sortKey && !hasUnusableSortKeys(issues)) {
      const result = await reorderIssue(droppedIssueId, sortKey)
      if (result.error) {
        setIssueFormError(result.error)
      }
    } else {
      const nextOrder = getItemsForDrop(
        issues,
        droppedIssueId,
        targetIssueId,
        placement
      )
      if (nextOrder) {
        const reindexError = await reindexIssues(nextOrder)
        if (reindexError) {
          setIssueFormError(reindexError)
        }
      }
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

  async function handleQualityDrop(
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

    const placement = getDropPlacement(event)
    const sortKey = getSortKeyForDrop(
      qualityStates,
      droppedQualityId,
      targetQualityId,
      placement
    )
    if (sortKey && !hasUnusableSortKeys(qualityStates)) {
      const result = await reorderQualityState(droppedQualityId, sortKey)
      if (result.error) {
        setQualityFormError(result.error)
      }
    } else {
      const nextOrder = getItemsForDrop(
        qualityStates,
        droppedQualityId,
        targetQualityId,
        placement
      )
      if (nextOrder) {
        const reindexError = await reindexQualityStates(nextOrder)
        if (reindexError) {
          setQualityFormError(reindexError)
        }
      }
    }

    setDraggedQualityId(null)
    setDragOverQualityId(null)
    setQualityDropPlacement("before")
  }

  return (
    <div className="min-h-0 space-y-4">
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
              aria-label="Add issue"
              onClick={openNewIssueForm}
            >
              <PlusIcon />
            </Button>
          </div>

          <div className="space-y-3">
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
                        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                          {issue.priority ? (
                            <PriorityBadge priority={issue.priority} />
                          ) : null}
                          <StatusBadge status={issue.status} />
                        </div>
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
              aria-label="Add quality"
              onClick={openNewQualityForm}
            >
              <PlusIcon />
            </Button>
          </div>

          <div className="space-y-3">
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
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {quality.notes ?? "No notes yet."}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                          <FrequencyBadge qualityState={quality} />
                          <StatusBadge status={quality.status} />
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <AboutMeEditor
        key={userProfile?.updated_at ?? "empty-profile"}
        initialAboutMe={userProfile?.about_me ?? ""}
        isLoading={isUserProfileLoading}
        updateUserProfile={updateUserProfile}
      />

      <Dialog
        open={isIssueDialogOpen}
        onOpenChange={handleIssueDialogOpenChange}
      >
        <DialogContent>
          <form onSubmit={handleIssueSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingIssue ? "Edit Issue" : "Add Issue"}
              </DialogTitle>
              <DialogDescription>
                Track a problem, limitation, or risk that affects training.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="issue-name">Issue</Label>
                <Input
                  id="issue-name"
                  value={issueForm.name}
                  maxLength={120}
                  placeholder="Left knee valgus"
                  autoFocus
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
                <DropdownSelect
                  id="issue-status"
                  value={issueForm.status}
                  options={[
                    { value: "active", label: "Active" },
                    { value: "resolved", label: "Resolved" },
                  ]}
                  onChange={(status) =>
                    setIssueForm((current) => ({
                      ...current,
                      status,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue-priority">Priority</Label>
                <DropdownSelect
                  id="issue-priority"
                  value={issueForm.priority}
                  options={[
                    { value: null, label: "No priority" },
                    { value: "high", label: "High" },
                    { value: "medium", label: "Medium" },
                    { value: "low", label: "Low" },
                  ]}
                  onChange={(priority) =>
                    setIssueForm((current) => ({
                      ...current,
                      priority,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
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
                <p className="text-sm text-destructive sm:col-span-2">
                  {issueFormError ?? mutationError}
                </p>
              ) : null}
            </div>

            <DialogFooter className="sm:justify-between">
              <div>
                {editingIssue ? (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isMutating}
                    onClick={() => {
                      setDeleteIssueError(null)
                      setPendingDeleteIssue(editingIssue)
                    }}
                  >
                    <Trash2Icon />
                    Delete
                  </Button>
                ) : null}
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <DialogClose type="button" disabled={isMutating}>
                  Cancel
                </DialogClose>
                <Button type="submit" disabled={isMutating}>
                  {editingIssue ? <PencilIcon /> : <PlusIcon />}
                  {isMutating
                    ? "Saving..."
                    : editingIssue
                      ? "Save Issue"
                      : "Add Issue"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isQualityDialogOpen}
        onOpenChange={handleQualityDialogOpenChange}
      >
        <DialogContent>
          <form onSubmit={handleQualitySubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingQuality ? "Edit Quality" : "Add Quality"}
              </DialogTitle>
              <DialogDescription>
                Track a capability you are building or maintaining.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4 sm:grid-cols-[1fr_150px]">
              {!editingQuality ? (
                <div className="sm:col-span-2">
                  <ExistingQualityPicker
                    qualities={availableQualities}
                    selectedQualityId={selectedQualityId}
                    query={qualityPickerQuery}
                    onQueryChange={setQualityPickerQuery}
                    onSelect={(quality) => {
                      setSelectedQualityId(quality.id)
                      setQualityForm((current) => ({
                        ...current,
                        name: quality.name,
                      }))
                      setQualityFormError(null)
                    }}
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="quality-name">Quality</Label>
                <Input
                  id="quality-name"
                  value={qualityForm.name}
                  maxLength={120}
                  placeholder="Ankle dorsiflexion control"
                  autoFocus
                  onChange={(event) => {
                    setSelectedQualityId(null)
                    setQualityForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quality-status">Status</Label>
                <DropdownSelect
                  id="quality-status"
                  value={qualityForm.status}
                  options={[
                    { value: "building", label: "Building" },
                    { value: "maintaining", label: "Maintaining" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                  onChange={(status) =>
                    setQualityForm((current) => ({
                      ...current,
                      status,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="quality-target">Frequency Target</Label>
                <FrequencyTargetInput
                  count={qualityForm.frequencyCount}
                  period={qualityForm.frequencyPeriod}
                  mode={qualityForm.frequencyMode}
                  onChange={(frequencyCount, frequencyPeriod, frequencyMode) =>
                    setQualityForm((current) => ({
                      ...current,
                      frequencyCount,
                      frequencyPeriod,
                      frequencyMode,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
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
                <p className="text-sm text-destructive sm:col-span-2">
                  {qualityFormError ?? mutationError}
                </p>
              ) : null}
            </div>

            <DialogFooter className="sm:justify-between">
              <div>
                {editingQuality ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isMutating}
                    onClick={() => {
                      void handleRemoveQualityFromProfile()
                    }}
                  >
                    <CircleSlashIcon />
                    Stop Tracking
                  </Button>
                ) : null}
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <DialogClose type="button" disabled={isMutating}>
                  Cancel
                </DialogClose>
                <Button type="submit" disabled={isMutating}>
                  {editingQuality ? <PencilIcon /> : <PlusIcon />}
                  {isMutating
                    ? "Saving..."
                    : editingQuality
                      ? "Save Quality"
                      : "Add Quality"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(pendingDeleteIssue)}
        onOpenChange={handleDeleteIssueDialogOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Issue?</AlertDialogTitle>
            <AlertDialogDescription>
              {`This will permanently delete "${pendingDeleteIssue?.name ?? "this issue"}". This cannot be undone.`}
            </AlertDialogDescription>
            {deleteIssueError ? (
              <p className="text-sm text-destructive">{deleteIssueError}</p>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={isMutating}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isMutating}
              onClick={() => {
                void handleDeleteIssue()
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
