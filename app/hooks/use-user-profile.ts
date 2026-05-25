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
  useUpdateQualityMutation,
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
  const [createQualityMutation, createQualityState] = useCreateQualityMutation()
  const [updateQualityMutation, updateQualityState] = useUpdateQualityMutation()

  const isMutating =
    createIssueState.isLoading ||
    updateIssueState.isLoading ||
    createQualityState.isLoading ||
    updateQualityState.isLoading
  const mutationError =
    getRtkErrorMessage(createIssueState.error) ??
    getRtkErrorMessage(updateIssueState.error) ??
    getRtkErrorMessage(createQualityState.error) ??
    getRtkErrorMessage(updateQualityState.error)

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
      createQuality,
      updateQuality,
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
      qualitiesQuery.data,
      qualitiesQuery.error,
      qualitiesQuery.isFetching,
      updateIssue,
      updateQuality,
    ]
  )
}
