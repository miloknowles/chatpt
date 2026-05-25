"use client"

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

import type { UserExercise } from "./types"

type DeleteExerciseDialogProps = {
  exercise: UserExercise | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => void
}

export function DeleteExerciseDialog({
  exercise,
  isSubmitting,
  onOpenChange,
  onDelete,
}: DeleteExerciseDialogProps) {
  return (
    <AlertDialog open={Boolean(exercise)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Exercise?</AlertDialogTitle>
          <AlertDialogDescription>
            {`This will permanently remove "${exercise?.name ?? "this exercise"}" from your library.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={isSubmitting}
            onClick={onDelete}
          >
            {isSubmitting ? "Deleting..." : "Delete Exercise"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
