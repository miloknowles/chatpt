"use client"

import { useEffect, useMemo } from "react"

import { useAuth } from "@/components/auth-provider"
import { useAppDispatch } from "@/lib/redux/store"
import { trainingApi } from "@/lib/redux/training-api"
import { createClient } from "@/lib/supabase/client"

const realtimeTables = [
  "user_issues",
  "user_qualities",
  "user_exercises",
  "user_exercise_types",
  "user_exercise_body_regions",
  "user_exercise_type_assignments",
  "user_exercise_body_region_assignments",
  "user_sessions",
  "user_supersets",
  "user_logged_exercises",
  "user_conversations",
  "user_messages",
] as const

export function DataRealtimeBridge() {
  const { user, isLoading } = useAuth()
  const dispatch = useAppDispatch()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (isLoading || !user) {
      return
    }

    const channel = supabase.channel(`rtk-query:${user.id}`)

    for (const table of realtimeTables) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          if (table === "user_issues") {
            dispatch(
              trainingApi.util.invalidateTags([
                { type: "Issues", id: "LIST" },
              ])
            )
            return
          }

          if (table === "user_qualities") {
            dispatch(
              trainingApi.util.invalidateTags([
                { type: "Qualities", id: "LIST" },
              ])
            )
            return
          }

          if (table === "user_exercises") {
            dispatch(
              trainingApi.util.invalidateTags([
                { type: "Exercises", id: "LIST" },
                { type: "ExerciseTaxonomy", id: "LIST" },
              ])
            )
            return
          }

          if (
            table === "user_exercise_types" ||
            table === "user_exercise_body_regions" ||
            table === "user_exercise_type_assignments" ||
            table === "user_exercise_body_region_assignments"
          ) {
            dispatch(
              trainingApi.util.invalidateTags([
                { type: "Exercises", id: "LIST" },
                { type: "ExerciseTaxonomy", id: "LIST" },
              ])
            )
            return
          }

          if (table === "user_sessions") {
            dispatch(
              trainingApi.util.invalidateTags([
                { type: "Sessions", id: "LIST" },
              ])
            )
            return
          }

          if (table === "user_supersets") {
            dispatch(
              trainingApi.util.invalidateTags([
                { type: "Supersets", id: "LIST" },
              ])
            )
            return
          }

          if (table === "user_logged_exercises") {
            dispatch(
              trainingApi.util.invalidateTags([
                { type: "LoggedExercises", id: "LIST" },
              ])
            )
            return
          }

          if (table === "user_conversations") {
            dispatch(
              trainingApi.util.invalidateTags([
                { type: "Conversations", id: "LIST" },
              ])
            )
            return
          }

          dispatch(
            trainingApi.util.invalidateTags([{ type: "Messages", id: "LIST" }])
          )
        }
      )
    }

    channel.subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [dispatch, isLoading, supabase, user])

  return null
}
