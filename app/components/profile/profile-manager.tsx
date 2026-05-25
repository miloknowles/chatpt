"use client"

import { useMemo, useState, type FormEvent } from "react"
import { PencilIcon, PlusIcon, XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUserProfile } from "@/hooks/use-user-profile"
import type {
  UserIssue,
  UserIssueStatus,
  UserQuality,
  UserQualityStatus,
} from "@/types/database"

type IssueFormValues = {
  name: string
  status: UserIssueStatus
  notes: string
}

type QualityFormValues = {
  name: string
  bodyRegion: string
  status: UserQualityStatus
  trainingFrequencyTarget: string
  trainingGoal: string
  notes: string
}

const EMPTY_ISSUE_FORM: IssueFormValues = {
  name: "",
  status: "active",
  notes: "",
}

const EMPTY_QUALITY_FORM: QualityFormValues = {
  name: "",
  bodyRegion: "",
  status: "building",
  trainingFrequencyTarget: "",
  trainingGoal: "",
  notes: "",
}

function optionalText(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function issueToFormValues(issue: UserIssue): IssueFormValues {
  return {
    name: issue.name,
    status: issue.status,
    notes: issue.notes ?? "",
  }
}

function qualityToFormValues(quality: UserQuality): QualityFormValues {
  return {
    name: quality.name,
    bodyRegion: quality.body_region ?? "",
    status: quality.status,
    trainingFrequencyTarget: quality.training_frequency_target ?? "",
    trainingGoal: quality.training_goal ?? "",
    notes: quality.notes ?? "",
  }
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function selectClassName() {
  return "h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
}

export function ProfileManager() {
  const {
    issues,
    qualities,
    isLoading,
    isMutating,
    error,
    mutationError,
    createIssue,
    updateIssue,
    createQuality,
    updateQuality,
  } = useUserProfile()

  const [editingIssue, setEditingIssue] = useState<UserIssue | null>(null)
  const [editingQuality, setEditingQuality] = useState<UserQuality | null>(null)
  const [issueForm, setIssueForm] = useState<IssueFormValues>(EMPTY_ISSUE_FORM)
  const [qualityForm, setQualityForm] =
    useState<QualityFormValues>(EMPTY_QUALITY_FORM)
  const [issueError, setIssueError] = useState<string | null>(null)
  const [qualityError, setQualityError] = useState<string | null>(null)

  const activeIssuesCount = useMemo(
    () => issues.filter((issue) => issue.status === "active").length,
    [issues]
  )
  const buildingQualitiesCount = useMemo(
    () => qualities.filter((quality) => quality.status === "building").length,
    [qualities]
  )

  function resetIssueForm() {
    setEditingIssue(null)
    setIssueForm(EMPTY_ISSUE_FORM)
    setIssueError(null)
  }

  function resetQualityForm() {
    setEditingQuality(null)
    setQualityForm(EMPTY_QUALITY_FORM)
    setQualityError(null)
  }

  async function handleIssueSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIssueError(null)

    const name = issueForm.name.trim()
    if (!name) {
      setIssueError("Name is required.")
      return
    }

    const payload = {
      name,
      status: issueForm.status,
      notes: optionalText(issueForm.notes),
    }
    const result = editingIssue
      ? await updateIssue(editingIssue.id, payload)
      : await createIssue(payload)

    if (result.error) {
      setIssueError(result.error)
      return
    }

    resetIssueForm()
  }

  async function handleQualitySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setQualityError(null)

    const name = qualityForm.name.trim()
    if (!name) {
      setQualityError("Name is required.")
      return
    }

    const payload = {
      name,
      body_region: optionalText(qualityForm.bodyRegion),
      status: qualityForm.status,
      training_frequency_target: optionalText(
        qualityForm.trainingFrequencyTarget
      ),
      training_goal: optionalText(qualityForm.trainingGoal),
      notes: optionalText(qualityForm.notes),
    }
    const result = editingQuality
      ? await updateQuality(editingQuality.id, payload)
      : await createQuality(payload)

    if (result.error) {
      setQualityError(result.error)
      return
    }

    resetQualityForm()
  }

  return (
    <div className="grid min-h-0 gap-4 lg:grid-cols-2">
      <section className="flex min-h-0 flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-base font-medium">Issues</h2>
            <p className="text-sm text-muted-foreground">
              {activeIssuesCount} active of {issues.length} total
            </p>
          </div>
          {editingIssue ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetIssueForm}
            >
              <XIcon />
              Cancel
            </Button>
          ) : null}
        </div>

        <Card size="sm" className="rounded-md">
          <CardHeader>
            <CardTitle>{editingIssue ? "Edit Issue" : "Add Issue"}</CardTitle>
            <CardDescription>
              Track pain points, risks, or constraints that shape the program.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleIssueSubmit}>
              <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                <div className="space-y-2">
                  <Label htmlFor="issue-name">Name</Label>
                  <Input
                    id="issue-name"
                    value={issueForm.name}
                    maxLength={120}
                    placeholder="Left Achilles sensitivity"
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
              <div className="space-y-2">
                <Label htmlFor="issue-notes">Notes</Label>
                <Textarea
                  id="issue-notes"
                  value={issueForm.notes}
                  placeholder="Symptoms, triggers, history, and constraints"
                  onChange={(event) =>
                    setIssueForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </div>
              {issueError || mutationError ? (
                <p className="text-sm text-destructive">
                  {issueError ?? mutationError}
                </p>
              ) : null}
              <Button type="submit" disabled={isMutating}>
                <PlusIcon />
                {isMutating
                  ? "Saving..."
                  : editingIssue
                    ? "Save Issue"
                    : "Add Issue"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex min-h-0 flex-col gap-2">
          {isLoading ? (
            <p className="rounded-md border border-border/60 p-3 text-sm text-muted-foreground">
              Loading issues...
            </p>
          ) : error ? (
            <p className="rounded-md border border-destructive/30 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : issues.length === 0 ? (
            <p className="rounded-md border border-border/60 p-3 text-sm text-muted-foreground">
              No issues yet.
            </p>
          ) : (
            issues.map((issue) => (
              <Card key={issue.id} size="sm" className="rounded-md">
                <CardHeader>
                  <CardTitle className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="min-w-0 truncate">{issue.name}</span>
                    <Badge
                      variant={
                        issue.status === "active" ? "destructive" : "secondary"
                      }
                    >
                      {formatStatus(issue.status)}
                    </Badge>
                  </CardTitle>
                  <CardAction>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${issue.name}`}
                      onClick={() => {
                        setEditingIssue(issue)
                        setIssueForm(issueToFormValues(issue))
                        setIssueError(null)
                      }}
                    >
                      <PencilIcon />
                    </Button>
                  </CardAction>
                </CardHeader>
                {issue.notes ? (
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {issue.notes}
                    </p>
                  </CardContent>
                ) : null}
              </Card>
            ))
          )}
        </div>
      </section>

      <section className="flex min-h-0 flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-base font-medium">Qualities</h2>
            <p className="text-sm text-muted-foreground">
              {buildingQualitiesCount} building of {qualities.length} total
            </p>
          </div>
          {editingQuality ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetQualityForm}
            >
              <XIcon />
              Cancel
            </Button>
          ) : null}
        </div>

        <Card size="sm" className="rounded-md">
          <CardHeader>
            <CardTitle>
              {editingQuality ? "Edit Quality" : "Add Quality"}
            </CardTitle>
            <CardDescription>
              Define what the program should build, maintain, or retire.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleQualitySubmit}>
              <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                <div className="space-y-2">
                  <Label htmlFor="quality-name">Name</Label>
                  <Input
                    id="quality-name"
                    value={qualityForm.name}
                    maxLength={120}
                    placeholder="Soleus capacity"
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
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quality-body-region">Body Region</Label>
                  <Input
                    id="quality-body-region"
                    value={qualityForm.bodyRegion}
                    maxLength={80}
                    placeholder="Ankle / calf"
                    onChange={(event) =>
                      setQualityForm((current) => ({
                        ...current,
                        bodyRegion: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quality-frequency">Frequency Target</Label>
                  <Input
                    id="quality-frequency"
                    value={qualityForm.trainingFrequencyTarget}
                    maxLength={120}
                    placeholder="3x/week"
                    onChange={(event) =>
                      setQualityForm((current) => ({
                        ...current,
                        trainingFrequencyTarget: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quality-goal">Training Goal</Label>
                <Input
                  id="quality-goal"
                  value={qualityForm.trainingGoal}
                  maxLength={180}
                  placeholder="Tolerate hill repeats without next-day symptoms"
                  onChange={(event) =>
                    setQualityForm((current) => ({
                      ...current,
                      trainingGoal: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
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
              {qualityError || mutationError ? (
                <p className="text-sm text-destructive">
                  {qualityError ?? mutationError}
                </p>
              ) : null}
              <Button type="submit" disabled={isMutating}>
                <PlusIcon />
                {isMutating
                  ? "Saving..."
                  : editingQuality
                    ? "Save Quality"
                    : "Add Quality"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex min-h-0 flex-col gap-2">
          {isLoading ? (
            <p className="rounded-md border border-border/60 p-3 text-sm text-muted-foreground">
              Loading qualities...
            </p>
          ) : error ? (
            <p className="rounded-md border border-destructive/30 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : qualities.length === 0 ? (
            <p className="rounded-md border border-border/60 p-3 text-sm text-muted-foreground">
              No qualities yet.
            </p>
          ) : (
            qualities.map((quality) => (
              <Card key={quality.id} size="sm" className="rounded-md">
                <CardHeader>
                  <CardTitle className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="min-w-0 truncate">{quality.name}</span>
                    <Badge variant="secondary">
                      {formatStatus(quality.status)}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {[quality.body_region, quality.training_frequency_target]
                      .filter(Boolean)
                      .join(" · ")}
                  </CardDescription>
                  <CardAction>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${quality.name}`}
                      onClick={() => {
                        setEditingQuality(quality)
                        setQualityForm(qualityToFormValues(quality))
                        setQualityError(null)
                      }}
                    >
                      <PencilIcon />
                    </Button>
                  </CardAction>
                </CardHeader>
                {quality.training_goal || quality.notes ? (
                  <CardContent className="space-y-2">
                    {quality.training_goal ? (
                      <p className="text-sm text-foreground">
                        {quality.training_goal}
                      </p>
                    ) : null}
                    {quality.notes ? (
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {quality.notes}
                      </p>
                    ) : null}
                  </CardContent>
                ) : null}
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
