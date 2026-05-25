import { redirect } from "next/navigation"

import { TrainingShell } from "@/components/training-shell"
import { UserSettingsForm } from "@/components/user-settings-form"
import { createClient } from "@/lib/supabase/server"

export default async function TrainingSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth?next=/training/settings")
  }

  const displayName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : ""

  return (
    <TrainingShell email={user.email ?? "Unknown email"} title="User Settings">
      <UserSettingsForm initialDisplayName={displayName} />
    </TrainingShell>
  )
}
