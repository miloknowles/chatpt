"use client"

import { useState, type DragEvent } from "react"
import {
  GripVerticalIcon,
  MoreHorizontalIcon,
  Trash2Icon,
} from "lucide-react"

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import type {
  SupersetDropHandler,
  UserLoggedExercise,
  UserSuperset,
} from "./types"

type SupersetCardProps = {
  superset: UserSuperset
  label: string
  loggedExercises: UserLoggedExercise[]
  draftName: string
  isDragging: boolean
  isDragTarget: boolean
  isMutating: boolean
  onDragStart: (event: DragEvent<HTMLElement>, supersetId: string) => void
  onDragEnd: () => void
  onDragOver: (event: DragEvent<HTMLElement>, supersetId: string) => void
  onDragLeave: () => void
  onDrop: SupersetDropHandler
  onDraftNameChange: (supersetId: string, value: string) => void
  onSaveName: (supersetId: string, previousName: string | null) => void
  onDelete: (supersetId: string) => Promise<boolean>
}

export function SupersetCard({
  superset,
  label,
  loggedExercises,
  draftName,
  isDragging,
  isDragTarget,
  isMutating,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onDraftNameChange,
  onSaveName,
  onDelete,
}: SupersetCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const supersetName = draftName.trim() || superset.name || "Untitled Superset"
  const isActionDisabled = isMutating || isDeleting

  return (
    <>
      <article
        draggable
        onDragStart={(event) => onDragStart(event, superset.id)}
        onDragEnd={onDragEnd}
        onDragOver={(event) => onDragOver(event, superset.id)}
        onDragLeave={onDragLeave}
        onDrop={(event) => {
          event.preventDefault()
          onDrop(event, superset.id)
        }}
        className={cn(
          "cursor-grab overflow-hidden rounded-md border border-border/70 bg-background shadow-xs transition active:cursor-grabbing",
          isDragging && "opacity-50",
          isDragTarget && "border-primary bg-muted"
        )}
      >
        <header className="flex items-center gap-3 border-b border-border/60 bg-muted px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <GripVerticalIcon className="size-4 text-muted-foreground" />
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
              {label}
            </div>
            <Input
              value={draftName}
              onChange={(event) =>
                onDraftNameChange(superset.id, event.target.value)
              }
              onBlur={() => onSaveName(superset.id, superset.name)}
              className="h-8 max-w-xs min-w-0 border-border bg-background text-left text-sm font-medium"
              aria-label="Superset name"
            />
          </div>
          <div className="shrink-0 text-right text-xs font-medium text-muted-foreground">
            {loggedExercises.length}{" "}
            {loggedExercises.length === 1 ? "exercise" : "exercises"}
          </div>
          <div
            className="shrink-0"
            onPointerDown={(event) => event.stopPropagation()}
            onDragStart={(event) => event.preventDefault()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Actions for ${supersetName}`}
                    disabled={isActionDisabled}
                  />
                }
              >
                <MoreHorizontalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-36">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2Icon />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="p-4">
          {loggedExercises.length > 0 ? (
            <div className="grid gap-2">
              {loggedExercises.map((loggedExercise, index) => (
                <div
                  key={loggedExercise.id}
                  className="flex items-center gap-2 rounded-md border border-border/50 bg-muted px-3 py-2 text-sm"
                >
                  <span className="flex h-7 min-w-8 shrink-0 items-center justify-center rounded-md bg-primary/15 px-2 text-xs font-semibold text-primary">
                    {label}
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate">
                      {loggedExercise.exercise_name}
                    </span>
                    {loggedExercise.exercise_notes ? (
                      <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">
                        {loggedExercise.exercise_notes}
                      </span>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border/70 bg-background px-3 py-4 text-center text-sm text-muted-foreground">
              Drop exercises here
            </div>
          )}
        </div>
      </article>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Superset?</AlertDialogTitle>
            <AlertDialogDescription>
              {`This will remove "${supersetName}" and its exercises from this session.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionDisabled}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isActionDisabled}
              onClick={async () => {
                setIsDeleting(true)
                const didDelete = await onDelete(superset.id)
                setIsDeleting(false)

                if (didDelete) {
                  setIsDeleteDialogOpen(false)
                }
              }}
            >
              {isActionDisabled ? "Deleting..." : "Delete Superset"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
