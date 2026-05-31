"use client"

import { useMemo, useRef, useState } from "react"
import BoringAvatar from "boring-avatars"
import { CameraIcon, Loader2 } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { createClient } from "@/lib/supabase/client"

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE_BYTES = 1 * 1024 * 1024
const BRAND_BEAM_DUOTONE_COLORS = ["var(--primary)", "#f59e0b"]

export function AvatarUpload() {
  const { user, updateAvatarUrl } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const avatarUrl =
    typeof user?.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null

  const avatarSeed = (user?.email ?? "").trim().toLowerCase()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input so the same file can be re-selected
    e.target.value = ""

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please upload a JPEG, PNG, or WebP image.")
      return
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError("Image must be under 1 MB.")
      return
    }

    if (!user) {
      setError("You must be signed in.")
      return
    }

    setError(null)
    setIsUploading(true)

    const path = `${user.id}/avatar`

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      setError(uploadError.message)
      setIsUploading(false)
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path)

    const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`

    const result = await updateAvatarUrl(urlWithCacheBust)

    setIsUploading(false)

    if (result.error) {
      setError(result.error)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="group relative size-16 overflow-hidden rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="size-full object-cover"
          />
        ) : (
          <BoringAvatar
            size={64}
            name={avatarSeed}
            variant="beam"
            colors={BRAND_BEAM_DUOTONE_COLORS}
          />
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          {isUploading ? (
            <Loader2 className="size-5 animate-spin text-white" />
          ) : (
            <CameraIcon className="size-5 text-white" />
          )}
        </div>

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="size-5 animate-spin text-white" />
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <p className="text-xs text-muted-foreground">
        Click to upload. Max 1 MB.
      </p>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
