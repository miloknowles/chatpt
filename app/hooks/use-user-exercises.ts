"use client"

import { useCallback, useMemo, useState } from "react"
import { skipToken } from "@reduxjs/toolkit/query"

import { useAuth } from "@/components/auth-provider"
import {
  useCreateExerciseMutation,
  useDeleteExerciseMutation,
  useGetExerciseBodyRegionsQuery,
  useGetExerciseTypesQuery,
  useGetExercisesQuery,
  useUpdateExerciseMutation,
  useUpdateExerciseImageUrlMutation,
  useUpdateExerciseVideoUrlMutation,
  useUpdateExerciseTaxonomyItemMutation,
  type ExercisePayload,
  type ExerciseTaxonomyUpdatePayload,
  type UserExerciseWithTaxonomy,
} from "@/lib/redux/training-api"

import {
  getRtkErrorMessage,
  getThrownErrorMessage,
  type HookActionResult,
} from "./rtk-query-utils"

interface UseUserExercisesOptions {
  pageSize?: number
  searchQuery?: string
}

export function useUserExercises({
  pageSize = 10,
  searchQuery = "",
}: UseUserExercisesOptions = {}) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [page, setPage] = useState(1)
  const normalizedSearchQuery = searchQuery.trim()
  const queryArgs =
    user && !isAuthLoading
      ? {
          userId: user.id,
          page,
          pageSize,
          searchQuery: normalizedSearchQuery,
        }
      : skipToken
  const taxonomyArgs =
    user && !isAuthLoading
      ? {
          userId: user.id,
        }
      : skipToken

  const exercisesQuery = useGetExercisesQuery(queryArgs)
  const exerciseTypesQuery = useGetExerciseTypesQuery(taxonomyArgs)
  const bodyRegionsQuery = useGetExerciseBodyRegionsQuery(taxonomyArgs)
  const [createExerciseMutation, createExerciseState] =
    useCreateExerciseMutation()
  const [updateExerciseMutation, updateExerciseState] =
    useUpdateExerciseMutation()
  const [updateExerciseImageUrlMutation, updateExerciseImageUrlState] =
    useUpdateExerciseImageUrlMutation()
  const [updateExerciseVideoUrlMutation, updateExerciseVideoUrlState] =
    useUpdateExerciseVideoUrlMutation()
  const [updateExerciseTaxonomyItemMutation, updateExerciseTaxonomyItemState] =
    useUpdateExerciseTaxonomyItemMutation()
  const [deleteExerciseMutation, deleteExerciseState] =
    useDeleteExerciseMutation()

  const exercises = useMemo(
    () => exercisesQuery.data?.exercises ?? [],
    [exercisesQuery.data?.exercises]
  )
  const totalCount = exercisesQuery.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const isMutating =
    createExerciseState.isLoading ||
    updateExerciseState.isLoading ||
    updateExerciseImageUrlState.isLoading ||
    updateExerciseVideoUrlState.isLoading ||
    updateExerciseTaxonomyItemState.isLoading ||
    deleteExerciseState.isLoading
  const mutationError =
    getRtkErrorMessage(createExerciseState.error) ??
    getRtkErrorMessage(updateExerciseState.error) ??
    getRtkErrorMessage(updateExerciseImageUrlState.error) ??
    getRtkErrorMessage(updateExerciseVideoUrlState.error) ??
    getRtkErrorMessage(updateExerciseTaxonomyItemState.error) ??
    getRtkErrorMessage(deleteExerciseState.error)

  const createExercise = useCallback(
    async (payload: ExercisePayload): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        await createExerciseMutation({ userId: user.id, payload }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [createExerciseMutation, user]
  )

  const updateExercise = useCallback(
    async (
      exerciseId: string,
      payload: ExercisePayload,
      optimisticExercise?: UserExerciseWithTaxonomy
    ): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        await updateExerciseMutation({
          userId: user.id,
          exerciseId,
          payload,
          optimisticExercise,
        }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [updateExerciseMutation, user]
  )

  const updateExerciseVideoUrl = useCallback(
    async (exerciseId: string, videoUrl: string): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        await updateExerciseVideoUrlMutation({
          userId: user.id,
          exerciseId,
          payload: {
            video_url: videoUrl.trim() || null,
          },
        }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [updateExerciseVideoUrlMutation, user]
  )

  const updateExerciseImageUrl = useCallback(
    async (exerciseId: string, imageUrl: string): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        await updateExerciseImageUrlMutation({
          userId: user.id,
          exerciseId,
          payload: {
            image_url: imageUrl.trim() || null,
          },
        }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [updateExerciseImageUrlMutation, user]
  )

  const deleteExercise = useCallback(
    async (exerciseId: string): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        await deleteExerciseMutation({ userId: user.id, exerciseId }).unwrap()
        const nextTotal = Math.max(0, totalCount - 1)
        const nextPage = Math.min(
          page,
          Math.max(1, Math.ceil(nextTotal / pageSize))
        )
        setPage(nextPage)
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [deleteExerciseMutation, page, pageSize, totalCount, user]
  )

  const updateExerciseTaxonomyItem = useCallback(
    async (payload: ExerciseTaxonomyUpdatePayload): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        await updateExerciseTaxonomyItemMutation({
          userId: user.id,
          payload,
        }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [updateExerciseTaxonomyItemMutation, user]
  )

  const refresh = useCallback(
    async (requestedPage = page) => {
      if (requestedPage !== page) {
        setPage(Math.max(1, requestedPage))
        return
      }

      await Promise.all([
        exercisesQuery.refetch(),
        exerciseTypesQuery.refetch(),
        bodyRegionsQuery.refetch(),
      ])
    },
    [bodyRegionsQuery, exerciseTypesQuery, exercisesQuery, page]
  )

  return useMemo(
    () => ({
      exercises,
      exerciseTypes: exerciseTypesQuery.data ?? [],
      bodyRegions: bodyRegionsQuery.data ?? [],
      totalCount,
      page,
      pageSize,
      totalPages,
      isLoading:
        isAuthLoading ||
        exercisesQuery.isLoading ||
        exerciseTypesQuery.isLoading ||
        bodyRegionsQuery.isLoading,
      isRefreshing:
        exercisesQuery.isFetching ||
        exerciseTypesQuery.isFetching ||
        bodyRegionsQuery.isFetching,
      isMutating,
      error:
        getRtkErrorMessage(exercisesQuery.error) ??
        getRtkErrorMessage(exerciseTypesQuery.error) ??
        getRtkErrorMessage(bodyRegionsQuery.error),
      mutationError,
      setPage,
      refresh,
      createExercise,
      updateExercise,
      updateExerciseImageUrl,
      updateExerciseVideoUrl,
      updateExerciseTaxonomyItem,
      deleteExercise,
    }),
    [
      createExercise,
      deleteExercise,
      exercises,
      bodyRegionsQuery.data,
      bodyRegionsQuery.error,
      bodyRegionsQuery.isFetching,
      bodyRegionsQuery.isLoading,
      exerciseTypesQuery.data,
      exerciseTypesQuery.error,
      exerciseTypesQuery.isFetching,
      exerciseTypesQuery.isLoading,
      exercisesQuery.error,
      exercisesQuery.isFetching,
      exercisesQuery.isLoading,
      isAuthLoading,
      isMutating,
      mutationError,
      page,
      pageSize,
      refresh,
      totalCount,
      totalPages,
      updateExercise,
      updateExerciseImageUrl,
      updateExerciseVideoUrl,
      updateExerciseTaxonomyItem,
    ]
  )
}
