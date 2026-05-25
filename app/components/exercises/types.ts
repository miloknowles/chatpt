import type { Database } from "@/types/database"

export type UserExercise = Database["public"]["Tables"]["user_exercises"]["Row"]

export type ExerciseFormValues = {
  name: string
  notes: string
  imageUrl: string
  videoUrl: string
  tags: string[]
  performanceText: string
}

export const EMPTY_FORM_VALUES: ExerciseFormValues = {
  name: "",
  notes: "",
  imageUrl: "",
  videoUrl: "",
  tags: [],
  performanceText: "",
}
