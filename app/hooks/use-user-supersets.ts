"use client"

import { useCallback, useMemo } from "react"
import { skipToken } from "@reduxjs/toolkit/query"

import { useAuth } from "@/components/auth-provider"
import {
  useCreateSupersetMutation,
  useDeleteSupersetMutation,
  useGetSupersetsQuery,
  useUpdateSupersetMutation,
  type SupersetCreatePayload,
  type SupersetUpdatePayload,
} from "@/lib/redux/training-api"
import type { UserSuperset } from "@/types/database"

import {
  getRtkErrorMessage,
  getThrownErrorMessage,
  type HookActionResult,
} from "./rtk-query-utils"

export function useUserSupersets(sessionId: string | null | undefined) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const queryArgs =
    user && !isAuthLoading && sessionId
      ? {
          userId: user.id,
          sessionId,
        }
      : skipToken
  const supersetsQuery = useGetSupersetsQuery(queryArgs)
  const [createSupersetMutation, createSupersetState] =
    useCreateSupersetMutation()
  const [updateSupersetMutation, updateSupersetState] =
    useUpdateSupersetMutation()
  const [deleteSupersetMutation, deleteSupersetState] =
    useDeleteSupersetMutation()

  const isMutating =
    createSupersetState.isLoading ||
    updateSupersetState.isLoading ||
    deleteSupersetState.isLoading
  const mutationError =
    getRtkErrorMessage(createSupersetState.error) ??
    getRtkErrorMessage(updateSupersetState.error) ??
    getRtkErrorMessage(deleteSupersetState.error)

  const createSuperset = useCallback(
    async (
      payload: SupersetCreatePayload
    ): HookActionResult<{ superset: UserSuperset }> => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        const superset = await createSupersetMutation({
          userId: user.id,
          payload,
        }).unwrap()
        return { superset }
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [createSupersetMutation, user]
  )

  const updateSuperset = useCallback(
    async (
      supersetId: string,
      payload: SupersetUpdatePayload
    ): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        await updateSupersetMutation({
          userId: user.id,
          supersetId,
          payload,
        }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [updateSupersetMutation, user]
  )

  const deleteSuperset = useCallback(
    async (supersetId: string): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      if (!sessionId) {
        return { error: "Select a session before deleting a superset." }
      }

      try {
        await deleteSupersetMutation({
          userId: user.id,
          sessionId,
          supersetId,
        }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [deleteSupersetMutation, sessionId, user]
  )

  return useMemo(
    () => ({
      supersets: supersetsQuery.data ?? [],
      isLoading: isAuthLoading || supersetsQuery.isFetching,
      isMutating,
      error: getRtkErrorMessage(supersetsQuery.error),
      mutationError,
      createSuperset,
      updateSuperset,
      deleteSuperset,
    }),
    [
      createSuperset,
      deleteSuperset,
      isAuthLoading,
      isMutating,
      mutationError,
      supersetsQuery.data,
      supersetsQuery.error,
      supersetsQuery.isFetching,
      updateSuperset,
    ]
  )
}
