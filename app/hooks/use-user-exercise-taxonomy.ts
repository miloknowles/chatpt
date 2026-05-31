"use client"

import { useCallback, useMemo } from "react"
import { skipToken } from "@reduxjs/toolkit/query"

import { useAuth } from "@/components/auth-provider"
import {
  useCreateExerciseTaxonomyItemMutation,
  useDeleteExerciseTaxonomyItemMutation,
  useGetExerciseBodyRegionsQuery,
  useGetExerciseTypesQuery,
  useUpdateExerciseTaxonomyItemMutation,
  useUpdateExerciseTaxonomySortKeyMutation,
  type ExerciseTaxonomyCreatePayload,
  type ExerciseTaxonomyDeletePayload,
  type ExerciseTaxonomySortPayload,
  type ExerciseTaxonomyUpdatePayload,
} from "@/lib/redux/training-api"

import {
  getRtkErrorMessage,
  getThrownErrorMessage,
  type HookActionResult,
} from "./rtk-query-utils"

export function useUserExerciseTaxonomy() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const taxonomyArgs =
    user && !isAuthLoading
      ? {
          userId: user.id,
        }
      : skipToken

  const exerciseTypesQuery = useGetExerciseTypesQuery(taxonomyArgs)
  const bodyRegionsQuery = useGetExerciseBodyRegionsQuery(taxonomyArgs)
  const [createTaxonomyItemMutation, createTaxonomyItemState] =
    useCreateExerciseTaxonomyItemMutation()
  const [updateTaxonomyItemMutation, updateTaxonomyItemState] =
    useUpdateExerciseTaxonomyItemMutation()
  const [updateTaxonomySortKeyMutation, updateTaxonomySortKeyState] =
    useUpdateExerciseTaxonomySortKeyMutation()
  const [deleteTaxonomyItemMutation, deleteTaxonomyItemState] =
    useDeleteExerciseTaxonomyItemMutation()

  const createTaxonomyItem = useCallback(
    async (payload: ExerciseTaxonomyCreatePayload): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        await createTaxonomyItemMutation({ userId: user.id, payload }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [createTaxonomyItemMutation, user]
  )

  const updateTaxonomyItem = useCallback(
    async (payload: ExerciseTaxonomyUpdatePayload): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        await updateTaxonomyItemMutation({ userId: user.id, payload }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [updateTaxonomyItemMutation, user]
  )

  const reorderTaxonomyItem = useCallback(
    async (payload: ExerciseTaxonomySortPayload): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        await updateTaxonomySortKeyMutation({
          userId: user.id,
          payload,
        }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [updateTaxonomySortKeyMutation, user]
  )

  const deleteTaxonomyItem = useCallback(
    async (payload: ExerciseTaxonomyDeletePayload): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        await deleteTaxonomyItemMutation({ userId: user.id, payload }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [deleteTaxonomyItemMutation, user]
  )

  return useMemo(
    () => ({
      exerciseTypes: exerciseTypesQuery.data ?? [],
      bodyRegions: bodyRegionsQuery.data ?? [],
      isLoading:
        isAuthLoading ||
        exerciseTypesQuery.isFetching ||
        bodyRegionsQuery.isFetching,
      isMutating:
        createTaxonomyItemState.isLoading ||
        updateTaxonomyItemState.isLoading ||
        updateTaxonomySortKeyState.isLoading ||
        deleteTaxonomyItemState.isLoading,
      error:
        getRtkErrorMessage(exerciseTypesQuery.error) ??
        getRtkErrorMessage(bodyRegionsQuery.error),
      mutationError:
        getRtkErrorMessage(createTaxonomyItemState.error) ??
        getRtkErrorMessage(updateTaxonomyItemState.error) ??
        getRtkErrorMessage(updateTaxonomySortKeyState.error) ??
        getRtkErrorMessage(deleteTaxonomyItemState.error),
      createTaxonomyItem,
      updateTaxonomyItem,
      reorderTaxonomyItem,
      deleteTaxonomyItem,
    }),
    [
      bodyRegionsQuery.data,
      bodyRegionsQuery.error,
      bodyRegionsQuery.isFetching,
      createTaxonomyItem,
      createTaxonomyItemState.error,
      createTaxonomyItemState.isLoading,
      deleteTaxonomyItem,
      deleteTaxonomyItemState.error,
      deleteTaxonomyItemState.isLoading,
      exerciseTypesQuery.data,
      exerciseTypesQuery.error,
      exerciseTypesQuery.isFetching,
      isAuthLoading,
      reorderTaxonomyItem,
      updateTaxonomyItem,
      updateTaxonomyItemState.error,
      updateTaxonomyItemState.isLoading,
      updateTaxonomySortKeyState.error,
      updateTaxonomySortKeyState.isLoading,
    ]
  )
}
