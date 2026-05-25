"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { useAuth } from "@/components/auth-provider"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database"

type UserSession = Database["public"]["Tables"]["user_sessions"]["Row"]

type SessionCreatePayload = {
  name?: string
  notes?: string | null
}

type SessionUpdatePayload = {
  name?: string
  notes?: string | null
}

function getErrorMessage(error: { message: string } | null) {
  if (!error) {
    return "Unexpected error."
  }

  return error.message
}

export function useUserSessions() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const supabase = useMemo(() => createClient(), [])

  const [sessions, setSessions] = useState<UserSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const loadSessions = useCallback(async () => {
    if (!user) {
      setSessions([])
      return
    }

    setIsLoading(true)
    setError(null)

    const { data, error: queryError } = await supabase
      .from("user_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })

    setIsLoading(false)

    if (queryError) {
      setError(getErrorMessage(queryError))
      return
    }

    setSessions(data ?? [])
  }, [supabase, user])

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    const loadTimer = window.setTimeout(() => {
      void loadSessions()
    }, 0)

    return () => {
      window.clearTimeout(loadTimer)
    }
  }, [isAuthLoading, loadSessions])

  useEffect(() => {
    if (isAuthLoading || !user) {
      return
    }

    const channelName = `user_sessions:${user.id}:${Math.random().toString(36).slice(2)}`
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_sessions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void loadSessions()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [isAuthLoading, loadSessions, supabase, user])

  const createSession = useCallback(
    async ({ name, notes = null }: SessionCreatePayload = {}) => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      const today = new Date().toISOString().slice(0, 10)
      const sessionName = name ?? `Untitled session - ${today}`

      setIsMutating(true)
      setMutationError(null)

      const { data, error: insertError } = await supabase
        .from("user_sessions")
        .insert({
          user_id: user.id,
          name: sessionName,
          notes,
          type: "template",
          date: today,
          estimated_duration_mins: null,
        })
        .select("*")
        .single()

      setIsMutating(false)

      if (insertError) {
        const errorMessage = getErrorMessage(insertError)
        setMutationError(errorMessage)
        return { error: errorMessage }
      }

      await loadSessions()
      return { session: data }
    },
    [loadSessions, supabase, user]
  )

  const updateSession = useCallback(
    async (sessionId: string, payload: SessionUpdatePayload) => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      setIsMutating(true)
      setMutationError(null)

      const { error: updateError } = await supabase
        .from("user_sessions")
        .update(payload)
        .eq("id", sessionId)
        .eq("user_id", user.id)

      setIsMutating(false)

      if (updateError) {
        const errorMessage = getErrorMessage(updateError)
        setMutationError(errorMessage)
        return { error: errorMessage }
      }

      await loadSessions()
      return {}
    },
    [loadSessions, supabase, user]
  )

  const deleteSession = useCallback(
    async (sessionId: string) => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      setIsMutating(true)
      setMutationError(null)

      const { error: deleteError } = await supabase
        .from("user_sessions")
        .delete()
        .eq("id", sessionId)
        .eq("user_id", user.id)

      setIsMutating(false)

      if (deleteError) {
        const errorMessage = getErrorMessage(deleteError)
        setMutationError(errorMessage)
        return { error: errorMessage }
      }

      await loadSessions()
      return {}
    },
    [loadSessions, supabase, user]
  )

  return {
    sessions,
    isLoading,
    isMutating,
    error,
    mutationError,
    createSession,
    updateSession,
    deleteSession,
  }
}
