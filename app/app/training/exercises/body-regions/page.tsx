import { redirect } from "next/navigation"

import { TaxonomyManager } from "@/components/exercises/taxonomy-manager"
import { TrainingShell } from "@/components/training-shell"
import { createClient } from "@/lib/supabase/server"

export default async function ExerciseBodyRegionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth?next=/training/exercises/body-regions")
  }

  return (
    <TrainingShell
      email={user.email ?? "Unknown email"}
      title="Body Regions"
      hideTitle
      contentClassName="md:flex md:h-full md:min-h-0 md:flex-col md:gap-4 md:space-y-0"
    >
      <TaxonomyManager
        kind="body_region"
        title="Body Regions"
        description="Optional tags used to help organize your exercise library"
        emptyLabel="No body regions yet. Add your first region to organize the library."
      />
    </TrainingShell>
  )
}
