import { redirect } from "next/navigation"

import { ProfileManager } from "@/components/profile/profile-manager"
import { TrainingShell } from "@/components/training-shell"
import { createClient } from "@/lib/supabase/server"

export default async function TrainingProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth?next=/training/profile")
  }

  return (
    <TrainingShell
      email={user.email ?? "Unknown email"}
      title="Profile"
      contentClassName="pb-24 md:flex md:min-h-0 md:flex-1 md:flex-col"
      desktopContentClassName="pb-24 md:flex md:min-h-0 md:flex-1 md:flex-col"
    >
      <ProfileManager />
    </TrainingShell>
  )
}
