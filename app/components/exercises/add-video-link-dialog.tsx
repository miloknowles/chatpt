"use client"

import type { FormEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import type { UserExercise } from "./types"

type AddVideoLinkDialogProps = {
  exercise: UserExercise | null
  videoUrl: string
  error: string | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onVideoUrlChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function AddVideoLinkDialog({
  exercise,
  videoUrl,
  error,
  isSubmitting,
  onOpenChange,
  onVideoUrlChange,
  onSubmit,
}: AddVideoLinkDialogProps) {
  return (
    <Dialog open={Boolean(exercise)} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add Video Link</DialogTitle>
            <DialogDescription>
              {`Attach a video link to "${exercise?.name ?? "this exercise"}".`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="exercise-video-link">Video link</Label>
            <Input
              id="exercise-video-link"
              value={videoUrl}
              disabled={isSubmitting}
              autoFocus
              onChange={(event) => onVideoUrlChange(event.target.value)}
              placeholder="https://..."
              aria-invalid={Boolean(error)}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
