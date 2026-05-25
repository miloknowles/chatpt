import { redirect } from "next/navigation"

import { ExerciseLibrary } from "@/components/exercise-library"
import { TrainingShell } from "@/components/training-shell"
import { createClient } from "@/lib/supabase/server"

export default async function TrainingExercisesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth?next=/training/exercises")
  }

  return (
    <TrainingShell
      email={user.email ?? "Unknown email"}
      title="Exercise Library"
      hideTitleOnMobile
    >
      <ExerciseLibrary />
    </TrainingShell>
  )
}
