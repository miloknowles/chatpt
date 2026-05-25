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
      hideTitle
      hideTitleOnMobile
      contentClassName="md:flex md:h-full md:min-h-0 md:flex-col md:gap-4 md:space-y-0"
    >
      <ExerciseLibrary />
    </TrainingShell>
  )
}
