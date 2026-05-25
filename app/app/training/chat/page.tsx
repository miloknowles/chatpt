import { redirect } from "next/navigation"
import { Suspense } from "react"

import { ChatPanel } from "@/components/chat"
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
    <TrainingShell email={user.email ?? "Unknown email"} title="Chat" hideTitle>
      <Suspense fallback={null}>
        <ChatPanel variant="page" />
      </Suspense>
    </TrainingShell>
  )
}
