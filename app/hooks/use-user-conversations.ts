"use client"

import { useCallback, useEffect, useMemo } from "react"
import { skipToken } from "@reduxjs/toolkit/query"

import { useAuth } from "@/components/auth-provider"
import {
  useCreateConversationMutation,
  useGetConversationsQuery,
  useTouchConversationMutation,
  type ConversationCreatePayload,
} from "@/lib/redux/training-api"
import type { UserConversation } from "@/types/database"

import {
  getRtkErrorMessage,
  getThrownErrorMessage,
  type HookActionResult,
} from "./rtk-query-utils"

const autoCreateConversationPromises = new Map<
  string,
  Promise<UserConversation>
>()

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
  const queryArgs =
    user && !isAuthLoading
      ? {
          userId: user.id,
          limit,
        }
      : skipToken
  const conversationsQuery = useGetConversationsQuery(queryArgs)
  const [createConversationMutation, createConversationState] =
    useCreateConversationMutation()
  const [touchConversationMutation, touchConversationState] =
    useTouchConversationMutation()

  const conversations = useMemo(
    () => conversationsQuery.data ?? [],
    [conversationsQuery.data]
  )
  const isMutating =
    createConversationState.isLoading || touchConversationState.isLoading
  const mutationError =
    getRtkErrorMessage(createConversationState.error) ??
    getRtkErrorMessage(touchConversationState.error)

  const createConversation = useCallback(
    async (
      payload: ConversationCreatePayload = {}
    ): HookActionResult<{ conversation: UserConversation }> => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        const conversation = await createConversationMutation({
          userId: user.id,
          payload,
        }).unwrap()
        return { conversation }
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [createConversationMutation, user]
  )

  useEffect(() => {
    if (
      !autoCreate ||
      !user ||
      isAuthLoading ||
      conversationsQuery.isFetching ||
      conversations.length > 0
    ) {
      return
    }

    let createPromise = autoCreateConversationPromises.get(user.id)

    if (!createPromise) {
      createPromise = createConversationMutation({
        userId: user.id,
        payload: { title: "New conversation" },
      })
        .unwrap()
        .finally(() => {
          autoCreateConversationPromises.delete(user.id)
        })

      autoCreateConversationPromises.set(user.id, createPromise)
    }

    void createPromise
  }, [
    autoCreate,
    conversations.length,
    conversationsQuery.isFetching,
    createConversationMutation,
    isAuthLoading,
    user,
  ])

  const touchConversation = useCallback(
    async (
      conversationId: string,
      messageContent: string
    ): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      const conversation = conversations.find((item) => item.id === conversationId)
      const title =
        conversation?.title === "New conversation"
          ? getConversationPreview(messageContent) || "New conversation"
          : undefined

      try {
        await touchConversationMutation({
          userId: user.id,
          payload: {
            conversationId,
            title,
            lastMessageAt: new Date().toISOString(),
          },
        }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [conversations, touchConversationMutation, user]
  )

  return useMemo(
    () => ({
      conversations,
      isLoading: isAuthLoading || conversationsQuery.isFetching,
      isMutating,
      error: getRtkErrorMessage(conversationsQuery.error),
      mutationError,
      createConversation,
      touchConversation,
    }),
    [
      conversations,
      conversationsQuery.error,
      conversationsQuery.isFetching,
      createConversation,
      isAuthLoading,
      isMutating,
      mutationError,
      touchConversation,
    ]
  )
}
