"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { useAuth } from "@/components/auth-provider"
import { createClient } from "@/lib/supabase/client"
import type { Database, Json } from "@/types/database"

type UserExercise = Database["public"]["Tables"]["user_exercises"]["Row"]

type ExercisePayload = {
  name: string
  notes: string | null
  image_url: string | null
  video_url: string | null
  tags: string[] | null
  performance: Json | null
}

interface UseUserExercisesOptions {
  pageSize?: number
  searchQuery?: string
}

function getErrorMessage(error: { message: string } | null) {
  if (!error) {
    return "Unexpected error."
  }

  return error.message
}

export function useUserExercises({
  pageSize = 10,
  searchQuery = "",
}: UseUserExercisesOptions = {}) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const normalizedSearchQuery = searchQuery.trim()

  const [exercises, setExercises] = useState<UserExercise[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const loadExercises = useCallback(
    async (requestedPage = page) => {
      if (!user) {
        setExercises([])
        setTotalCount(0)
        return
      }

      const normalizedPage = Math.max(1, requestedPage)
      const start = (normalizedPage - 1) * pageSize
      const end = start + pageSize - 1

      setIsLoading(true)
      setError(null)

      let query = supabase
        .from("user_exercises")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)

      if (normalizedSearchQuery) {
        const wildcardQuery = `%${normalizedSearchQuery}%`
        query = query.or(
          `name.ilike.${wildcardQuery},notes.ilike.${wildcardQuery}`
        )
      }

      const { data, count, error: queryError } = await query
        .order("updated_at", { ascending: false })
        .range(start, end)

      setIsLoading(false)

      if (queryError) {
        setError(getErrorMessage(queryError))
        return
      }

      setExercises(data ?? [])
      setTotalCount(count ?? 0)
    },
    [normalizedSearchQuery, page, pageSize, supabase, user]
  )

  const loadAvailableTags = useCallback(async () => {
    if (!user) {
      setAvailableTags([])
      return
    }

    const { data, error: tagsError } = await supabase
      .from("user_exercises")
      .select("tags")
      .eq("user_id", user.id)
      .not("tags", "is", null)

    if (tagsError) {
      return
    }

    const nextTags = Array.from(
      new Set(
        (data ?? [])
          .flatMap((row) => row.tags ?? [])
          .map((tag) => tag.trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))

    setAvailableTags(nextTags)
  }, [supabase, user])

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    const loadTimer = window.setTimeout(() => {
      void loadExercises(page)
      void loadAvailableTags()
    }, 0)

    return () => {
      window.clearTimeout(loadTimer)
    }
  }, [isAuthLoading, loadAvailableTags, loadExercises, page])

  const createExercise = useCallback(
    async (payload: ExercisePayload) => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      setIsMutating(true)
      setMutationError(null)

      const { error: insertError } = await supabase.from("user_exercises").insert({
        user_id: user.id,
        ...payload,
      })

      setIsMutating(false)

      if (insertError) {
        const errorMessage = getErrorMessage(insertError)
        setMutationError(errorMessage)
        return { error: errorMessage }
      }

      await Promise.all([loadExercises(page), loadAvailableTags()])
      return {}
    },
    [loadAvailableTags, loadExercises, page, supabase, user]
  )

  const updateExercise = useCallback(
    async (exerciseId: string, payload: ExercisePayload) => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      setIsMutating(true)
      setMutationError(null)

      const { error: updateError } = await supabase
        .from("user_exercises")
        .update(payload)
        .eq("id", exerciseId)
        .eq("user_id", user.id)

      setIsMutating(false)

      if (updateError) {
        const errorMessage = getErrorMessage(updateError)
        setMutationError(errorMessage)
        return { error: errorMessage }
      }

      await Promise.all([loadExercises(page), loadAvailableTags()])
      return {}
    },
    [loadAvailableTags, loadExercises, page, supabase, user]
  )

  const deleteExercise = useCallback(
    async (exerciseId: string) => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      setIsMutating(true)
      setMutationError(null)

      const { error: deleteError } = await supabase
        .from("user_exercises")
        .delete()
        .eq("id", exerciseId)
        .eq("user_id", user.id)

      setIsMutating(false)

      if (deleteError) {
        const errorMessage = getErrorMessage(deleteError)
        setMutationError(errorMessage)
        return { error: errorMessage }
      }

      const nextTotal = Math.max(0, totalCount - 1)
      const nextPage = Math.min(page, Math.max(1, Math.ceil(nextTotal / pageSize)))
      setPage(nextPage)
      await Promise.all([loadExercises(nextPage), loadAvailableTags()])

      return {}
    },
    [loadAvailableTags, loadExercises, page, pageSize, supabase, totalCount, user]
  )

  return {
    exercises,
    availableTags,
    totalCount,
    page,
    pageSize,
    totalPages,
    isLoading,
    isMutating,
    error,
    mutationError,
    setPage,
    refresh: loadExercises,
    createExercise,
    updateExercise,
    deleteExercise,
  }
}
