import { redirect } from "next/navigation"

import { TaxonomyManager } from "@/components/exercises/taxonomy-manager"
import { TrainingShell } from "@/components/training-shell"
import { createClient } from "@/lib/supabase/server"

export default async function ExerciseTypesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth?next=/training/exercises/types")
  }

  return (
    <TrainingShell
      email={user.email ?? "Unknown email"}
      title="Exercise Types"
      hideTitle
      contentClassName="md:flex md:h-full md:min-h-0 md:flex-col md:gap-4 md:space-y-0"
    >
      <TaxonomyManager
        kind="type"
        title="Exercise Types"
        description="Optional tags used to help organize your exercise library"
        emptyLabel="No exercise types yet. Add your first type to organize the library."
      />
    </TrainingShell>
  )
}
