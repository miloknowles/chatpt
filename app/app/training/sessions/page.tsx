import { redirect } from "next/navigation"

import { TrainingShell } from "@/components/training-shell"
import { createClient } from "@/lib/supabase/server"

export default async function TrainingSessionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth?next=/training/sessions")
  }

  return (
    <TrainingShell email={user.email ?? "Unknown email"} title="Session Builder">
      <div className="text-sm text-muted-foreground">
        Session builder page coming next.
      </div>
    </TrainingShell>
  )
}
