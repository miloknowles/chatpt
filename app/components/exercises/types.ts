import type { Database } from "@/types/database"

export type UserExercise =
  Database["public"]["Tables"]["user_exercises"]["Row"] & {
    types: Database["public"]["Tables"]["user_exercise_types"]["Row"][]
    body_regions: Database["public"]["Tables"]["user_exercise_body_regions"]["Row"][]
  }

export type ExerciseTaxonomyItem =
  | Database["public"]["Tables"]["user_exercise_types"]["Row"]
  | Database["public"]["Tables"]["user_exercise_body_regions"]["Row"]

export type ExerciseTaxonomySelection = {
  id?: string
  name: string
  display_color?: string | null
}

export type ExerciseFormValues = {
  name: string
  notes: string
  imageUrl: string
  videoUrl: string
  types: ExerciseTaxonomySelection[]
  bodyRegions: ExerciseTaxonomySelection[]
  performanceText: string
}

export const EMPTY_FORM_VALUES: ExerciseFormValues = {
  name: "",
  notes: "",
  imageUrl: "",
  videoUrl: "",
  types: [],
  bodyRegions: [],
  performanceText: "",
}
