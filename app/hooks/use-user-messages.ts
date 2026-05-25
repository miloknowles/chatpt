"use client"

import { useCallback, useMemo } from "react"
import { skipToken } from "@reduxjs/toolkit/query"

import { useAuth } from "@/components/auth-provider"
import {
  useCreateMessageMutation,
  useGetMessagesQuery,
} from "@/lib/redux/training-api"
import type { UserMessage } from "@/types/database"

import {
  getRtkErrorMessage,
  getThrownErrorMessage,
  type HookActionResult,
} from "./rtk-query-utils"

export function useUserMessages({
  conversationId,
}: {
  conversationId: string | null
}) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const queryArgs =
    user && !isAuthLoading && conversationId
      ? {
          userId: user.id,
          conversationId,
        }
      : skipToken
  const messagesQuery = useGetMessagesQuery(queryArgs)
  const [createMessageMutation, createMessageState] = useCreateMessageMutation()

  const createMessage = useCallback(
    async (content: string): HookActionResult<{ message: UserMessage }> => {
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

      try {
        const message = await createMessageMutation({
          userId: user.id,
          conversationId,
          content: trimmedContent,
        }).unwrap()
        return { message }
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [conversationId, createMessageMutation, user]
  )

  return useMemo(
    () => ({
      messages: messagesQuery.data ?? [],
      isLoading: isAuthLoading || messagesQuery.isFetching,
      isMutating: createMessageState.isLoading,
      error: getRtkErrorMessage(messagesQuery.error),
      mutationError: getRtkErrorMessage(createMessageState.error),
      createMessage,
    }),
    [
      createMessage,
      createMessageState.error,
      createMessageState.isLoading,
      isAuthLoading,
      messagesQuery.data,
      messagesQuery.error,
      messagesQuery.isFetching,
    ]
  )
}
