import Link from "next/link"
import { redirect } from "next/navigation"

import { TrainingShell } from "@/components/training-shell"
import { createClient } from "@/lib/supabase/server"

export default async function TrainingProgramPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth?next=/training/program")
  }

  return (
    <TrainingShell email={user.email ?? "Unknown email"} title="Program">
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/training/sessions"
          className="rounded-md border border-border/60 p-4 text-sm hover:bg-muted/40"
        >
          <p className="font-medium text-foreground">Session Builder</p>
          <p className="mt-1 text-muted-foreground">
            Create and organize session templates.
          </p>
        </Link>
        <Link
          href="/training/exercises"
          className="rounded-md border border-border/60 p-4 text-sm hover:bg-muted/40"
        >
          <p className="font-medium text-foreground">Exercise Library</p>
          <p className="mt-1 text-muted-foreground">
            Manage exercises, tags, media, and default prescriptions.
          </p>
        </Link>
      </div>
    </TrainingShell>
  )
}
