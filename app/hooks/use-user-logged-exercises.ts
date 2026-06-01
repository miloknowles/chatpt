"use client"

import { useCallback, useMemo } from "react"
import { skipToken } from "@reduxjs/toolkit/query"

import { useAuth } from "@/components/auth-provider"
import {
  useCreateLoggedExerciseMutation,
  useGetLoggedExercisesQuery,
  useUpdateLoggedExerciseMutation,
  type LoggedExerciseCreatePayload,
  type LoggedExerciseUpdatePayload,
} from "@/lib/redux/training-api"
import type { UserLoggedExercise } from "@/types/database"

import {
  getRtkErrorMessage,
  getThrownErrorMessage,
  type HookActionResult,
} from "./rtk-query-utils"

export function useUserLoggedExercises(sessionId: string | null | undefined) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const queryArgs =
    user && !isAuthLoading && sessionId
      ? {
          userId: user.id,
          sessionId,
        }
      : skipToken
  const loggedExercisesQuery = useGetLoggedExercisesQuery(queryArgs)
  const [createLoggedExerciseMutation, createLoggedExerciseState] =
    useCreateLoggedExerciseMutation()
  const [updateLoggedExerciseMutation, updateLoggedExerciseState] =
    useUpdateLoggedExerciseMutation()

  const createLoggedExercise = useCallback(
    async (
      payload: LoggedExerciseCreatePayload
    ): HookActionResult<{ loggedExercise: UserLoggedExercise }> => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        const loggedExercise = await createLoggedExerciseMutation({
          userId: user.id,
          payload,
        }).unwrap()
        return { loggedExercise }
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [createLoggedExerciseMutation, user]
  )

  const updateLoggedExercise = useCallback(
    async (
      loggedExerciseId: string,
      payload: LoggedExerciseUpdatePayload
    ): HookActionResult => {
      if (!user || !sessionId) {
        return { error: "You must be signed in." }
      }

      try {
        await updateLoggedExerciseMutation({
          userId: user.id,
          sessionId,
          loggedExerciseId,
          payload,
        }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [sessionId, updateLoggedExerciseMutation, user]
  )

  return useMemo(
    () => ({
      loggedExercises: loggedExercisesQuery.data ?? [],
      isLoading: isAuthLoading || loggedExercisesQuery.isFetching,
      isMutating:
        createLoggedExerciseState.isLoading ||
        updateLoggedExerciseState.isLoading,
      error: getRtkErrorMessage(loggedExercisesQuery.error),
      mutationError:
        getRtkErrorMessage(createLoggedExerciseState.error) ??
        getRtkErrorMessage(updateLoggedExerciseState.error),
      createLoggedExercise,
      updateLoggedExercise,
    }),
    [
      createLoggedExercise,
      createLoggedExerciseState.error,
      createLoggedExerciseState.isLoading,
      isAuthLoading,
      loggedExercisesQuery.data,
      loggedExercisesQuery.error,
      loggedExercisesQuery.isFetching,
      updateLoggedExercise,
      updateLoggedExerciseState.error,
      updateLoggedExerciseState.isLoading,
    ]
  )
}
