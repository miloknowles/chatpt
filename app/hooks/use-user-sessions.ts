"use client"

import { useCallback, useMemo } from "react"
import { skipToken } from "@reduxjs/toolkit/query"

import { useAuth } from "@/components/auth-provider"
import {
  useCreateSessionMutation,
  useDeleteSessionMutation,
  useGetSessionsQuery,
  useUpdateSessionMutation,
  type SessionCreatePayload,
  type SessionUpdatePayload,
} from "@/lib/redux/training-api"
import type { UserSession } from "@/types/database"

import {
  getRtkErrorMessage,
  getThrownErrorMessage,
  type HookActionResult,
} from "./rtk-query-utils"

export function useUserSessions() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const queryArgs =
    user && !isAuthLoading
      ? {
          userId: user.id,
        }
      : skipToken
  const sessionsQuery = useGetSessionsQuery(queryArgs)
  const [createSessionMutation, createSessionState] =
    useCreateSessionMutation()
  const [updateSessionMutation, updateSessionState] =
    useUpdateSessionMutation()
  const [deleteSessionMutation, deleteSessionState] =
    useDeleteSessionMutation()

  const isMutating =
    createSessionState.isLoading ||
    updateSessionState.isLoading ||
    deleteSessionState.isLoading
  const mutationError =
    getRtkErrorMessage(createSessionState.error) ??
    getRtkErrorMessage(updateSessionState.error) ??
    getRtkErrorMessage(deleteSessionState.error)

  const createSession = useCallback(
    async (
      payload: SessionCreatePayload = {}
    ): HookActionResult<{ session: UserSession }> => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        const session = await createSessionMutation({
          userId: user.id,
          payload,
        }).unwrap()
        return { session }
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [createSessionMutation, user]
  )

  const updateSession = useCallback(
    async (
      sessionId: string,
      payload: SessionUpdatePayload
    ): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        await updateSessionMutation({
          userId: user.id,
          sessionId,
          payload,
        }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [updateSessionMutation, user]
  )

  const deleteSession = useCallback(
    async (sessionId: string): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        await deleteSessionMutation({ userId: user.id, sessionId }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [deleteSessionMutation, user]
  )

  return useMemo(
    () => ({
      sessions: sessionsQuery.data ?? [],
      isLoading: isAuthLoading || sessionsQuery.isFetching,
      isMutating,
      error: getRtkErrorMessage(sessionsQuery.error),
      mutationError,
      createSession,
      updateSession,
      deleteSession,
    }),
    [
      createSession,
      deleteSession,
      isAuthLoading,
      isMutating,
      mutationError,
      sessionsQuery.data,
      sessionsQuery.error,
      sessionsQuery.isFetching,
      updateSession,
    ]
  )
}
