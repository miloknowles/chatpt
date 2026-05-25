"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { useAuth } from "@/components/auth-provider"
import { createClient } from "@/lib/supabase/client"
import type { UserMessage } from "@/types/database"

function getErrorMessage(error: { message: string } | null) {
  if (!error) {
    return "Unexpected error."
  }

  return error.message
}

export function useUserMessages({
  conversationId,
}: {
  conversationId: string | null
}) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const supabase = useMemo(() => createClient(), [])

  const [messages, setMessages] = useState<UserMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const loadMessages = useCallback(async () => {
    if (!user || !conversationId) {
      setMessages([])
      return
    }

    setIsLoading(true)
    setError(null)

    const { data, error: queryError } = await supabase
      .from("user_messages")
      .select("*")
      .eq("user_id", user.id)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })

    setIsLoading(false)

    if (queryError) {
      setError(getErrorMessage(queryError))
      return
    }

    setMessages(data ?? [])
  }, [conversationId, supabase, user])

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    const loadTimer = window.setTimeout(() => {
      void loadMessages()
    }, 0)

    return () => {
      window.clearTimeout(loadTimer)
    }
  }, [isAuthLoading, loadMessages])

  useEffect(() => {
    if (isAuthLoading || !user || !conversationId) {
      return
    }

    const channelName = `user_messages:${conversationId}:${Math.random().toString(36).slice(2)}`
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          void loadMessages()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [conversationId, isAuthLoading, loadMessages, supabase, user])

  const createMessage = useCallback(
    async (content: string) => {
      const trimmedContent = content.trim()

      if (!user) {
        return { error: "You must be signed in." }
      }

      if (!conversationId) {
        return { error: "Choose a conversation first." }
      }

      if (!trimmedContent) {
        return { error: "Message cannot be empty." }
      }

      setIsMutating(true)
      setMutationError(null)

      const { data, error: insertError } = await supabase
        .from("user_messages")
        .insert({
          user_id: user.id,
          conversation_id: conversationId,
          role: "user",
          status: "complete",
          content: trimmedContent,
        })
        .select("*")
        .single()

      setIsMutating(false)

      if (insertError) {
        const errorMessage = getErrorMessage(insertError)
        setMutationError(errorMessage)
        return { error: errorMessage }
      }

      if (data) {
        setMessages((current) => {
          if (current.some((message) => message.id === data.id)) {
            return current
          }

          return [...current, data]
        })
      }

      return { message: data }
    },
    [conversationId, supabase, user]
  )

  return {
    messages,
    isLoading,
    isMutating,
    error,
    mutationError,
    createMessage,
  }
}
