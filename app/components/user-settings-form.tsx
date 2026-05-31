"use client"

import { useMemo, useState } from "react"
import { CopyIcon } from "lucide-react"

import { AvatarUpload } from "@/components/avatar-upload"
import { useAuth } from "@/components/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UserSettingsFormProps {
  initialDisplayName: string
}

export function UserSettingsForm({ initialDisplayName }: UserSettingsFormProps) {
  const { isLoading, session, updateDisplayName, user } = useAuth()

  const currentDisplayName = useMemo(() => {
    const metadataName = user?.user_metadata?.display_name
    return typeof metadataName === "string" ? metadataName : initialDisplayName
  }, [initialDisplayName, user?.user_metadata])

  const [displayName, setDisplayName] = useState(currentDisplayName)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [copyInfo, setCopyInfo] = useState<string | null>(null)
  const [copyError, setCopyError] = useState<string | null>(null)

  const normalizedDisplayName = displayName.trim()
  const isDirty = normalizedDisplayName !== currentDisplayName.trim()
  const isDisabled = isLoading || isSaving || !isDirty
  const accessToken = session?.access_token ?? ""

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

  async function handleCopyAccessToken() {
    if (!accessToken) {
      setCopyError("No active session token found.")
      setCopyInfo(null)
      return
    }

    try {
      await navigator.clipboard.writeText(accessToken)
      setCopyInfo("Copied token to clipboard.")
      setCopyError(null)
    } catch {
      setCopyError("Failed to copy token. Copy it manually from the field below.")
      setCopyInfo(null)
    }
  }

  return (
    <div className="space-y-8">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="display-name">Display Name</Label>
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

      <section className="space-y-2">
        <Label>Profile Image</Label>
        <AvatarUpload />
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">MCP Access Token</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Use this as your bearer token env var:</span>
            <Badge variant="secondary" className="font-mono text-[11px]">
              CHATPT_MCP_TOKEN
            </Badge>
          </div>
        </div>

        <textarea
          readOnly
          value={accessToken}
          className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono"
          placeholder="Sign in to generate an access token."
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void handleCopyAccessToken()}
          disabled={!accessToken}
        >
          <CopyIcon />
          Copy Token
        </Button>

        {copyInfo ? <p className="text-xs text-primary">{copyInfo}</p> : null}
        {copyError ? <p className="text-xs text-destructive">{copyError}</p> : null}
      </section>
    </div>
  )
}
