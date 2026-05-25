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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type AddSupersetDialogProps = {
  open: boolean
  name: string
  isMutating: boolean
  onOpenChange: (open: boolean) => void
  onNameChange: (value: string) => void
  onCreate: () => void
}

export function AddSupersetDialog({
  open,
  name,
  isMutating,
  onOpenChange,
  onNameChange,
  onCreate,
}: AddSupersetDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Posterior chain"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                onCreate()
              }
            }}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            type="button"
            disabled={!name.trim() || isMutating}
            onClick={onCreate}
          >
            {isMutating ? "Adding..." : "Add Superset"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
