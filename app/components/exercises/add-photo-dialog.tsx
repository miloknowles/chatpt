"use client"

import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
} from "react"
import { ImageIcon, LinkIcon, UploadIcon } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
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
import { createClient } from "@/lib/supabase/client"

import type { UserExercise } from "./types"

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
const ACCEPTED_IMAGE_TYPES_LABEL = "JPEG, PNG, or WebP"
const EXERCISE_IMAGE_BUCKET = "exercise-images"
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

type PhotoMode = "link" | "upload"

type AddPhotoDialogProps = {
  exercise: UserExercise | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSaveImageUrl: (imageUrl: string) => Promise<{ error?: string }>
}

function getFileExtension(file: File) {
  if (file.name.includes(".")) {
    return file.name.split(".").pop()?.toLowerCase() ?? "png"
  }

  if (file.type === "image/jpeg") {
    return "jpg"
  }
  if (file.type === "image/webp") {
    return "webp"
  }
  return "png"
}

function getSafeFileName(file: File) {
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image"
  const safeBaseName = baseName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return `${safeBaseName || "image"}.${getFileExtension(file)}`
}

function validateImageFile(file: File) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return `Please use ${ACCEPTED_IMAGE_TYPES_LABEL}.`
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Image must be under 5 MB."
  }

  return null
}

function getImageFileFromClipboard(event: ClipboardEvent<HTMLElement>) {
  for (const item of Array.from(event.clipboardData.items)) {
    if (item.kind === "file" && ACCEPTED_IMAGE_TYPES.includes(item.type)) {
      return item.getAsFile()
    }
  }

  return null
}

export function AddPhotoDialog({
  exercise,
  isSubmitting,
  onOpenChange,
  onSaveImageUrl,
}: AddPhotoDialogProps) {
  const { user } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = useMemo(() => createClient(), [])
  const [mode, setMode] = useState<PhotoMode>("link")
  const [imageLinkValue, setImageLinkValue] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const isBusy = isSubmitting || isUploading

  function resetForm() {
    setMode("link")
    setImageLinkValue("")
    setSelectedFile(null)
    setError(null)
    setIsUploading(false)
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      resetForm()
    }
    onOpenChange(open)
  }

  function selectFile(file: File | null) {
    if (!file) {
      return
    }

    const validationError = validateImageFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setMode("upload")
    setSelectedFile(file)
    setError(null)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0] ?? null)
    event.target.value = ""
  }

  function handlePaste(event: ClipboardEvent<HTMLElement>) {
    const file = getImageFileFromClipboard(event)
    if (!file) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    selectFile(file)
  }

  async function uploadImageFile(file: File) {
    if (!user) {
      return { error: "You must be signed in." }
    }

    if (!exercise) {
      return { error: "Select an exercise first." }
    }

    const validationError = validateImageFile(file)
    if (validationError) {
      return { error: validationError }
    }

    const path = `${user.id}/${exercise.id}/${Date.now()}-${getSafeFileName(file)}`
    const { error: uploadError } = await supabase.storage
      .from(EXERCISE_IMAGE_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadError) {
      return { error: uploadError.message }
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(EXERCISE_IMAGE_BUCKET).getPublicUrl(path)

    const result = await onSaveImageUrl(publicUrl)
    if (result.error) {
      await supabase.storage.from(EXERCISE_IMAGE_BUCKET).remove([path])
    }

    return result
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (mode === "link") {
      const nextImageLink = imageLinkValue.trim()
      if (!nextImageLink) {
        setError("Image link is required.")
        return
      }

      const result = await onSaveImageUrl(nextImageLink)
      if (result.error) {
        setError(result.error)
        return
      }

      handleOpenChange(false)
      return
    }

    if (!selectedFile) {
      setError("Choose or paste an image first.")
      return
    }

    setIsUploading(true)
    const result = await uploadImageFile(selectedFile)
    setIsUploading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    handleOpenChange(false)
  }

  return (
    <Dialog open={Boolean(exercise)} onOpenChange={handleOpenChange}>
      <DialogContent onPaste={handlePaste}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add Photo</DialogTitle>
            <DialogDescription>
              {`Attach a photo to "${exercise?.name ?? "this exercise"}".`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={mode === "link" ? "secondary" : "outline"}
              disabled={isBusy}
              onClick={() => {
                setMode("link")
                setError(null)
              }}
            >
              <LinkIcon />
              Paste link
            </Button>
            <Button
              type="button"
              variant={mode === "upload" ? "secondary" : "outline"}
              disabled={isBusy}
              onClick={() => {
                setMode("upload")
                setError(null)
              }}
            >
              <UploadIcon />
              Upload
            </Button>
          </div>

          {mode === "link" ? (
            <div className="space-y-2">
              <Label htmlFor="exercise-photo-link">Photo link</Label>
              <Input
                id="exercise-photo-link"
                value={imageLinkValue}
                disabled={isBusy}
                autoFocus
                onChange={(event) => setImageLinkValue(event.target.value)}
                placeholder="https://..."
                aria-invalid={Boolean(error)}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                onClick={() => inputRef.current?.click()}
              >
                <UploadIcon />
                Choose photo
              </Button>
              <div
                tabIndex={0}
                className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                onPaste={handlePaste}
              >
                <ImageIcon className="size-5" />
                <span>
                  {selectedFile
                    ? selectedFile.name || "Pasted image"
                    : "Paste an image here"}
                </span>
                <span className="text-xs">
                  {ACCEPTED_IMAGE_TYPES_LABEL}, max 5 MB
                </span>
              </div>
            </div>
          )}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isBusy}>
              {isUploading ? "Uploading..." : isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
