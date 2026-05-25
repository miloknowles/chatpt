import { redirect } from "next/navigation"

import { AuthPanel } from "@/components/auth-panel"
import { createClient } from "@/lib/supabase/server"

export default async function AuthPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return <AuthPanel />
}
