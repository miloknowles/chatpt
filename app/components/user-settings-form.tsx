"use client"

import { useMemo, useState } from "react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UserSettingsFormProps {
  initialDisplayName: string
}

export function UserSettingsForm({ initialDisplayName }: UserSettingsFormProps) {
  const { isLoading, updateDisplayName, user } = useAuth()

  const currentDisplayName = useMemo(() => {
    const metadataName = user?.user_metadata?.display_name
    return typeof metadataName === "string" ? metadataName : initialDisplayName
  }, [initialDisplayName, user?.user_metadata])

  const [displayName, setDisplayName] = useState(currentDisplayName)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const normalizedDisplayName = displayName.trim()
  const isDirty = normalizedDisplayName !== currentDisplayName.trim()
  const isDisabled = isLoading || isSaving || !isDirty

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!normalizedDisplayName) {
      setError("Display name cannot be empty.")
      setInfo(null)
      return
    }

    setError(null)
    setInfo(null)
    setIsSaving(true)

    const result = await updateDisplayName(normalizedDisplayName)

    setIsSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setInfo("Display name updated.")
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="display-name">Display name</Label>
        <Input
          id="display-name"
          name="display-name"
          type="text"
          autoComplete="name"
          maxLength={64}
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="h-10 bg-background"
          placeholder="Your name"
        />
      </div>

      <Button type="submit" disabled={isDisabled}>
        {isSaving ? "Saving..." : "Save Settings"}
      </Button>

      {info ? <p className="text-sm text-primary">{info}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  )
}
