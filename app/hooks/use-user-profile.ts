"use client"

import { useCallback, useMemo } from "react"
import { skipToken } from "@reduxjs/toolkit/query"

import { useAuth } from "@/components/auth-provider"
import {
  useCreateIssueMutation,
  useCreateQualityMutation,
  useGetIssuesQuery,
  useGetQualitiesQuery,
  useUpdateIssueMutation,
  useUpdateIssueSortKeyMutation,
  useUpdateQualityMutation,
  useUpdateQualitySortKeyMutation,
  type IssuePayload,
  type QualityPayload,
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
  const qualitiesQuery = useGetQualitiesQuery(queryArgs)
  const [createIssueMutation, createIssueState] = useCreateIssueMutation()
  const [updateIssueMutation, updateIssueState] = useUpdateIssueMutation()
  const [updateIssueSortKeyMutation, updateIssueSortKeyState] =
    useUpdateIssueSortKeyMutation()
  const [createQualityMutation, createQualityState] = useCreateQualityMutation()
  const [updateQualityMutation, updateQualityState] = useUpdateQualityMutation()
  const [updateQualitySortKeyMutation, updateQualitySortKeyState] =
    useUpdateQualitySortKeyMutation()

  const isMutating =
    createIssueState.isLoading ||
    updateIssueState.isLoading ||
    updateIssueSortKeyState.isLoading ||
    createQualityState.isLoading ||
    updateQualityState.isLoading ||
    updateQualitySortKeyState.isLoading
  const mutationError =
    getRtkErrorMessage(createIssueState.error) ??
    getRtkErrorMessage(updateIssueState.error) ??
    getRtkErrorMessage(updateIssueSortKeyState.error) ??
    getRtkErrorMessage(createQualityState.error) ??
    getRtkErrorMessage(updateQualityState.error) ??
    getRtkErrorMessage(updateQualitySortKeyState.error)

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

  return useMemo(
    () => ({
      issues: issuesQuery.data ?? [],
      qualities: qualitiesQuery.data ?? [],
      isLoading:
        isAuthLoading || issuesQuery.isFetching || qualitiesQuery.isFetching,
      isMutating,
      error:
        getRtkErrorMessage(issuesQuery.error) ??
        getRtkErrorMessage(qualitiesQuery.error),
      mutationError,
      createIssue,
      updateIssue,
      reorderIssue,
      createQuality,
      updateQuality,
      reorderQuality,
    }),
    [
      createIssue,
      createQuality,
      isAuthLoading,
      isMutating,
      issuesQuery.data,
      issuesQuery.error,
      issuesQuery.isFetching,
      mutationError,
      reorderIssue,
      reorderQuality,
      qualitiesQuery.data,
      qualitiesQuery.error,
      qualitiesQuery.isFetching,
      updateIssue,
      updateQuality,
    ]
  )
}
