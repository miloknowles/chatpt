"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { useAuth } from "@/components/auth-provider"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database"

type UserSuperset = Database["public"]["Tables"]["user_supersets"]["Row"]

type SupersetCreatePayload = {
  sessionId: string
  name: string | null
  sortKey: string
}

type SupersetUpdatePayload = {
  name?: string | null
  sort_key?: string
}

function getErrorMessage(error: { message: string } | null) {
  if (!error) {
    return "Unexpected error."
  }

  return error.message
}

export function useUserSupersets(sessionId: string | null | undefined) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const supabase = useMemo(() => createClient(), [])

  const [supersets, setSupersets] = useState<UserSuperset[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const loadSupersets = useCallback(async () => {
    if (!user || !sessionId) {
      setSupersets([])
      return
    }

    setIsLoading(true)
    setError(null)

    const { data, error: queryError } = await supabase
      .from("user_supersets")
      .select("*")
      .eq("user_id", user.id)
      .eq("session_id", sessionId)
      .order("sort_key", { ascending: true })

    setIsLoading(false)

    if (queryError) {
      setError(getErrorMessage(queryError))
      return
    }

    setSupersets(data ?? [])
  }, [sessionId, supabase, user])

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    const loadTimer = window.setTimeout(() => {
      void loadSupersets()
    }, 0)

    return () => {
      window.clearTimeout(loadTimer)
    }
  }, [isAuthLoading, loadSupersets])

  useEffect(() => {
    if (isAuthLoading || !user || !sessionId) {
      return
    }

    const channelName = `user_supersets:${user.id}:${sessionId}:${Math.random()
      .toString(36)
      .slice(2)}`
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_supersets",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void loadSupersets()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [isAuthLoading, loadSupersets, sessionId, supabase, user])

  const createSuperset = useCallback(
    async ({ sessionId: targetSessionId, name, sortKey }: SupersetCreatePayload) => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      setIsMutating(true)
      setMutationError(null)

      const { data, error: insertError } = await supabase
        .from("user_supersets")
        .insert({
          user_id: user.id,
          session_id: targetSessionId,
          name,
          sort_key: sortKey,
        })
        .select("*")
        .single()

      setIsMutating(false)

      if (insertError) {
        const errorMessage = getErrorMessage(insertError)
        setMutationError(errorMessage)
        return { error: errorMessage }
      }

      await loadSupersets()
      return { superset: data }
    },
    [loadSupersets, supabase, user]
  )

  const updateSuperset = useCallback(
    async (supersetId: string, payload: SupersetUpdatePayload) => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      setIsMutating(true)
      setMutationError(null)

      const { error: updateError } = await supabase
        .from("user_supersets")
        .update(payload)
        .eq("id", supersetId)
        .eq("user_id", user.id)

      setIsMutating(false)

      if (updateError) {
        const errorMessage = getErrorMessage(updateError)
        setMutationError(errorMessage)
        return { error: errorMessage }
      }

      await loadSupersets()
      return {}
    },
    [loadSupersets, supabase, user]
  )

  return {
    supersets,
    isLoading,
    isMutating,
    error,
    mutationError,
    createSuperset,
    updateSuperset,
  }
}
