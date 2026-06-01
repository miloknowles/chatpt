import { redirect } from "next/navigation"

import { QualityManager } from "@/components/exercises/quality-manager"
import { TrainingShell } from "@/components/training-shell"
import { createClient } from "@/lib/supabase/server"

export default async function ExerciseQualitiesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth?next=/training/exercises/qualities")
  }

  return (
    <TrainingShell
      email={user.email ?? "Unknown email"}
      title="Trained Qualities"
      hideTitle
      contentClassName="md:flex md:h-full md:min-h-0 md:flex-col md:gap-4 md:space-y-0"
    >
      <QualityManager />
    </TrainingShell>
  )
}
