import type { DragEvent } from "react"

import type { Database } from "@/types/database"

export type UserExercise = Database["public"]["Tables"]["user_exercises"]["Row"]
export type UserSession = Database["public"]["Tables"]["user_sessions"]["Row"]
export type UserSuperset = Database["public"]["Tables"]["user_supersets"]["Row"]

export type SupersetDropHandler = (
  event: DragEvent<HTMLElement>,
  targetSupersetId: string
) => void
