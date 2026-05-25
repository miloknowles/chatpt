import { redirect } from "next/navigation"

import { TrainingShell } from "@/components/training-shell"
import { createClient } from "@/lib/supabase/server"

export default async function TrainingChatPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth?next=/training/chat")
  }

  return (
    <TrainingShell email={user.email ?? "Unknown email"} title="Chat">
      <div className="text-sm text-muted-foreground">
        Chat page coming next.
      </div>
    </TrainingShell>
  )
}
