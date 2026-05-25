"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { useAuth } from "@/components/auth-provider"
import { createClient } from "@/lib/supabase/client"
import type { UserConversation } from "@/types/database"

type ConversationCreatePayload = {
  title?: string
}

type LoadConversationsOptions = {
  autoCreate?: boolean
}

const autoCreateConversationPromises = new Map<
  string,
  Promise<UserConversation | null>
>()

function getErrorMessage(error: { message: string } | null) {
  if (!error) {
    return "Unexpected error."
  }

  return error.message
}

function getConversationPreview(content: string) {
  const preview = content.trim().replace(/\s+/g, " ")

  if (preview.length <= 60) {
    return preview
  }

  return `${preview.slice(0, 57).trim()}...`
}

export function useUserConversations({
  limit = 10,
  autoCreate = true,
}: {
  limit?: number
  autoCreate?: boolean
} = {}) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const supabase = useMemo(() => createClient(), [])

  const [conversations, setConversations] = useState<UserConversation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const loadConversations = useCallback(async (
    options: LoadConversationsOptions = {}
  ) => {
    const { autoCreate = true } = options

    if (!user) {
      setConversations([])
      return
    }

    setIsLoading(true)
    setError(null)

    const { data, error: queryError } = await supabase
      .from("user_conversations")
      .select("*")
      .eq("user_id", user.id)
      .neq("status", "deleted")
      .order("updated_at", { ascending: false })
      .limit(limit)

    setIsLoading(false)

    if (queryError) {
      setError(getErrorMessage(queryError))
      return
    }

    const loadedConversations = data ?? []

    if (autoCreate && loadedConversations.length === 0) {
      let createPromise = autoCreateConversationPromises.get(user.id)

      if (!createPromise) {
        createPromise = Promise.resolve(
          supabase
            .from("user_conversations")
            .insert({
              user_id: user.id,
              title: "New conversation",
              status: "active",
            })
            .select("*")
            .single()
        )
          .then(({ data: createdConversation, error: insertError }) => {
            if (insertError) {
              throw insertError
            }

            return createdConversation
          })
          .finally(() => {
            autoCreateConversationPromises.delete(user.id)
          })

        autoCreateConversationPromises.set(user.id, createPromise)
      }

      try {
        const createdConversation = await createPromise
        setConversations(createdConversation ? [createdConversation] : [])
      } catch (insertError) {
        setError(getErrorMessage(insertError as { message: string }))
        setConversations([])
      }

      return
    }

    setConversations(loadedConversations)
  }, [limit, supabase, user])

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    const loadTimer = window.setTimeout(() => {
      void loadConversations({ autoCreate })
    }, 0)

    return () => {
      window.clearTimeout(loadTimer)
    }
  }, [autoCreate, isAuthLoading, loadConversations])

  useEffect(() => {
    if (isAuthLoading || !user) {
      return
    }

    const channelName = `user_conversations:${user.id}:${Math.random().toString(36).slice(2)}`
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_conversations",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void loadConversations({ autoCreate: false })
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [isAuthLoading, loadConversations, supabase, user])

  const createConversation = useCallback(
    async ({ title = "New conversation" }: ConversationCreatePayload = {}) => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      setIsMutating(true)
      setMutationError(null)

      const { data, error: insertError } = await supabase
        .from("user_conversations")
        .insert({
          user_id: user.id,
          title,
          status: "active",
        })
        .select("*")
        .single()

      setIsMutating(false)

      if (insertError) {
        const errorMessage = getErrorMessage(insertError)
        setMutationError(errorMessage)
        return { error: errorMessage }
      }

      await loadConversations({ autoCreate: false })
      return { conversation: data }
    },
    [loadConversations, supabase, user]
  )

  const touchConversation = useCallback(
    async (conversationId: string, messageContent: string) => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      const conversation = conversations.find((item) => item.id === conversationId)
      const now = new Date().toISOString()
      const payload: {
        last_message_at: string
        title?: string
      } = {
        last_message_at: now,
      }

      if (conversation?.title === "New conversation") {
        payload.title = getConversationPreview(messageContent) || "New conversation"
      }

      const { error: updateError } = await supabase
        .from("user_conversations")
        .update(payload)
        .eq("id", conversationId)
        .eq("user_id", user.id)

      if (updateError) {
        const errorMessage = getErrorMessage(updateError)
        setMutationError(errorMessage)
        return { error: errorMessage }
      }

      await loadConversations({ autoCreate: false })
      return {}
    },
    [conversations, loadConversations, supabase, user]
  )

  return {
    conversations,
    isLoading,
    isMutating,
    error,
    mutationError,
    createConversation,
    touchConversation,
  }
}
