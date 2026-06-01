"use client"

import { useCallback, useMemo } from "react"
import { skipToken } from "@reduxjs/toolkit/query"

import { useAuth } from "@/components/auth-provider"
import {
  useCreateIssueMutation,
  useCreateQualityMutation,
  useCreateQualityStateMutation,
  useDeleteQualityStateMutation,
  useDeleteQualityMutation,
  useGetUserProfileQuery,
  useGetIssuesQuery,
  useGetQualitiesQuery,
  useGetQualityStatesQuery,
  useUpsertUserProfileMutation,
  useUpdateIssueMutation,
  useUpdateIssueSortKeyMutation,
  useUpdateQualityStateMutation,
  useUpdateQualityStateSortKeyMutation,
  useUpdateQualityMutation,
  useUpdateQualitySortKeyMutation,
  type IssuePayload,
  type QualityStateCreatePayload,
  type QualityStatePayload,
  type QualityPayload,
  type UserProfilePayload,
} from "@/lib/redux/training-api"

import {
  getRtkErrorMessage,
  getThrownErrorMessage,
  type HookActionResult,
} from "./rtk-query-utils"

export function useUserProfile() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const queryArgs =
    user && !isAuthLoading
      ? {
          userId: user.id,
        }
      : skipToken

  const issuesQuery = useGetIssuesQuery(queryArgs)
  const userProfileQuery = useGetUserProfileQuery(queryArgs)
  const qualitiesQuery = useGetQualitiesQuery(queryArgs)
  const qualityStatesQuery = useGetQualityStatesQuery(queryArgs)
  const [upsertUserProfileMutation, upsertUserProfileState] =
    useUpsertUserProfileMutation()
  const [createIssueMutation, createIssueState] = useCreateIssueMutation()
  const [updateIssueMutation, updateIssueState] = useUpdateIssueMutation()
  const [updateIssueSortKeyMutation, updateIssueSortKeyState] =
    useUpdateIssueSortKeyMutation()
  const [createQualityMutation, createQualityMutationState] =
    useCreateQualityMutation()
  const [updateQualityMutation, updateQualityMutationState] =
    useUpdateQualityMutation()
  const [updateQualitySortKeyMutation, updateQualitySortKeyState] =
    useUpdateQualitySortKeyMutation()
  const [deleteQualityMutation, deleteQualityMutationState] =
    useDeleteQualityMutation()
  const [createQualityStateMutation, createQualityProfileState] =
    useCreateQualityStateMutation()
  const [updateQualityStateMutation, updateQualityProfileState] =
    useUpdateQualityStateMutation()
  const [
    updateQualityStateSortKeyMutation,
    updateQualityStateSortKeyState,
  ] = useUpdateQualityStateSortKeyMutation()
  const [deleteQualityStateMutation, deleteQualityProfileState] =
    useDeleteQualityStateMutation()

  const isMutating =
    upsertUserProfileState.isLoading ||
    createIssueState.isLoading ||
    updateIssueState.isLoading ||
    updateIssueSortKeyState.isLoading ||
    createQualityMutationState.isLoading ||
    updateQualityMutationState.isLoading ||
    updateQualitySortKeyState.isLoading ||
    deleteQualityMutationState.isLoading ||
    createQualityProfileState.isLoading ||
    updateQualityProfileState.isLoading ||
    updateQualityStateSortKeyState.isLoading ||
    deleteQualityProfileState.isLoading
  const mutationError =
    getRtkErrorMessage(upsertUserProfileState.error) ??
    getRtkErrorMessage(createIssueState.error) ??
    getRtkErrorMessage(updateIssueState.error) ??
    getRtkErrorMessage(updateIssueSortKeyState.error) ??
    getRtkErrorMessage(createQualityMutationState.error) ??
    getRtkErrorMessage(updateQualityMutationState.error) ??
    getRtkErrorMessage(updateQualitySortKeyState.error) ??
    getRtkErrorMessage(deleteQualityMutationState.error) ??
    getRtkErrorMessage(createQualityProfileState.error) ??
    getRtkErrorMessage(updateQualityProfileState.error) ??
    getRtkErrorMessage(updateQualityStateSortKeyState.error) ??
    getRtkErrorMessage(deleteQualityProfileState.error)

  const updateUserProfile = useCallback(
    async (payload: UserProfilePayload): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        await upsertUserProfileMutation({ userId: user.id, payload }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [upsertUserProfileMutation, user]
  )

  const createIssue = useCallback(
    async (payload: IssuePayload): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        await createIssueMutation({ userId: user.id, payload }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [createIssueMutation, user]
  )

  const updateIssue = useCallback(
    async (issueId: string, payload: IssuePayload): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        await updateIssueMutation({ userId: user.id, issueId, payload }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [updateIssueMutation, user]
  )

  const reorderIssue = useCallback(
    async (issueId: string, sortKey: string): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        await updateIssueSortKeyMutation({
          userId: user.id,
          issueId,
          payload: { sort_key: sortKey },
        }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [updateIssueSortKeyMutation, user]
  )

  const createQuality = useCallback(
    async (payload: QualityPayload): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        await createQualityMutation({ userId: user.id, payload }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [createQualityMutation, user]
  )

  const updateQuality = useCallback(
    async (qualityId: string, payload: QualityPayload): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        await updateQualityMutation({
          userId: user.id,
          qualityId,
          payload,
        }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [updateQualityMutation, user]
  )

  const reorderQuality = useCallback(
    async (qualityId: string, sortKey: string): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        await updateQualitySortKeyMutation({
          userId: user.id,
          qualityId,
          payload: { sort_key: sortKey },
        }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [updateQualitySortKeyMutation, user]
  )

  const deleteQuality = useCallback(
    async (qualityId: string): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        await deleteQualityMutation({ userId: user.id, qualityId }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [deleteQualityMutation, user]
  )

  const createQualityState = useCallback(
    async (payload: QualityStateCreatePayload): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        await createQualityStateMutation({ userId: user.id, payload }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [createQualityStateMutation, user]
  )

  const updateQualityState = useCallback(
    async (stateId: string, payload: QualityStatePayload): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        await updateQualityStateMutation({
          userId: user.id,
          stateId,
          payload,
        }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [updateQualityStateMutation, user]
  )

  const reorderQualityState = useCallback(
    async (stateId: string, sortKey: string): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        await updateQualityStateSortKeyMutation({
          userId: user.id,
          stateId,
          payload: { sort_key: sortKey },
        }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [updateQualityStateSortKeyMutation, user]
  )

  const deleteQualityState = useCallback(
    async (stateId: string): HookActionResult => {
      if (!user) {
        return { error: "You must be signed in." }
      }

      try {
        await deleteQualityStateMutation({ userId: user.id, stateId }).unwrap()
        return {}
      } catch (error) {
        return { error: getThrownErrorMessage(error) }
      }
    },
    [deleteQualityStateMutation, user]
  )

  return useMemo(
    () => ({
      issues: issuesQuery.data ?? [],
      userProfile: userProfileQuery.data ?? null,
      qualities: qualitiesQuery.data ?? [],
      qualityStates:
        qualityStatesQuery.data?.filter((state) => state.status !== "inactive") ??
        [],
      isLoading:
        isAuthLoading ||
        issuesQuery.isLoading ||
        qualitiesQuery.isLoading ||
        qualityStatesQuery.isLoading,
      isUserProfileLoading: isAuthLoading || userProfileQuery.isLoading,
      isRefreshing:
        userProfileQuery.isFetching ||
        issuesQuery.isFetching ||
        qualitiesQuery.isFetching ||
        qualityStatesQuery.isFetching,
      isMutating,
      error:
        getRtkErrorMessage(issuesQuery.error) ??
        getRtkErrorMessage(userProfileQuery.error) ??
        getRtkErrorMessage(qualitiesQuery.error) ??
        getRtkErrorMessage(qualityStatesQuery.error),
      mutationError,
      updateUserProfile,
      createIssue,
      updateIssue,
      reorderIssue,
      createQuality,
      updateQuality,
      reorderQuality,
      deleteQuality,
      createQualityState,
      updateQualityState,
      reorderQualityState,
      deleteQualityState,
    }),
    [
      createIssue,
      createQuality,
      createQualityState,
      deleteQualityState,
      deleteQuality,
      isAuthLoading,
      isMutating,
      issuesQuery.data,
      issuesQuery.error,
      issuesQuery.isFetching,
      issuesQuery.isLoading,
      mutationError,
      reorderIssue,
      reorderQuality,
      qualitiesQuery.data,
      qualitiesQuery.error,
      qualitiesQuery.isFetching,
      qualitiesQuery.isLoading,
      qualityStatesQuery.data,
      qualityStatesQuery.error,
      qualityStatesQuery.isFetching,
      qualityStatesQuery.isLoading,
      updateIssue,
      updateQuality,
      updateQualityState,
      updateUserProfile,
      userProfileQuery.data,
      userProfileQuery.error,
      userProfileQuery.isFetching,
      userProfileQuery.isLoading,
      reorderQualityState,
    ]
  )
}
