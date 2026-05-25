import { redirect } from "next/navigation"

import { TrainingShell } from "@/components/training-shell"
import { createClient } from "@/lib/supabase/server"

export default async function TrainingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth?next=/training")
  }

  return <TrainingShell email={user.email ?? "Unknown email"} />
}
