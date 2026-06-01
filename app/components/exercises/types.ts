import type { Database } from "@/types/database"

export type UserExercise =
  Database["public"]["Tables"]["user_exercises"]["Row"] & {
    types: Database["public"]["Tables"]["user_exercise_types"]["Row"][]
    qualities: Database["public"]["Tables"]["user_qualities"]["Row"][]
  }

export type ExerciseTaxonomyItem =
  | Database["public"]["Tables"]["user_exercise_types"]["Row"]
  | Database["public"]["Tables"]["user_body_regions"]["Row"]

export type ExerciseQualityItem =
  Database["public"]["Tables"]["user_qualities"]["Row"] & {
    display_color: string | null
  }

export type ExercisePickerItem = ExerciseTaxonomyItem | ExerciseQualityItem

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
  qualities: ExerciseTaxonomySelection[]
  performanceText: string
}

export const EMPTY_FORM_VALUES: ExerciseFormValues = {
  name: "",
  notes: "",
  imageUrl: "",
  videoUrl: "",
  types: [],
  qualities: [],
  performanceText: "",
}
