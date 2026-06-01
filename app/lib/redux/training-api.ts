"use client"

import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing"

import { createClient } from "@/lib/supabase/client"
import type {
  Json,
  UserConversation,
  UserBodyRegion,
  UserExercise,
  UserExerciseType,
  UserIssue,
  UserLoggedExercise,
  UserMessage,
  UserProfile,
  UserQuality,
  UserQualityState,
  UserSession,
  UserSuperset,
} from "@/types/database"

type QueryError = string

export type ExerciseTaxonomyPayload = {
  existingIds: string[]
  customNames: string[]
}

export type ExercisePayload = {
  name: string
  notes: string | null
  image_url: string | null
  video_url: string | null
  performance: Json | null
  types: ExerciseTaxonomyPayload
  qualities: ExerciseTaxonomyPayload
}

export type ExerciseTaxonomyUpdatePayload = {
  kind: "type" | "body_region"
  itemId: string
  name: string
  description: string | null
  display_color: string | null
}

export type ExerciseTaxonomyCreatePayload = {
  kind: "type" | "body_region"
  name: string
  description: string | null
  display_color: string | null
  sort_key: string
}

export type ExerciseTaxonomySortPayload = {
  kind: "type" | "body_region"
  itemId: string
  sort_key: string
}

export type ExerciseTaxonomyDeletePayload = {
  kind: "type" | "body_region"
  itemId: string
}

export type ExerciseVideoUrlPayload = {
  video_url: string | null
}

export type ExerciseImageUrlPayload = {
  image_url: string | null
}

export type ExerciseUpdateMutationArgs = {
  userId: string
  exerciseId: string
  payload: ExercisePayload
  optimisticExercise?: UserExerciseWithTaxonomy
}

export type ExerciseVideoUrlMutationArgs = {
  userId: string
  exerciseId: string
  payload: ExerciseVideoUrlPayload
}

export type ExerciseImageUrlMutationArgs = {
  userId: string
  exerciseId: string
  payload: ExerciseImageUrlPayload
}

export type ExercisesQueryArgs = {
  userId: string
  page: number
  pageSize: number
  searchQuery: string
  typeIds: string[]
  qualityIds: string[]
}

export type ExercisesResult = {
  exercises: UserExerciseWithTaxonomy[]
  totalCount: number
}

export type UserExerciseWithTaxonomy = UserExercise & {
  types: UserExerciseType[]
  qualities: UserQuality[]
}

export type IssuePayload = {
  name: string
  notes: string | null
  status: UserIssue["status"]
  sort_key?: string | null
}

export type QualityPayload = {
  name: string
  description: string | null
  body_region_id: string | null
  display_color: string | null
  sort_key?: string | null
}

export type UserQualityStateWithQuality = UserQualityState & {
  quality: UserQuality
}

export type QualityStateCreatePayload = {
  quality_id?: string | null
  name: string
  status: UserQualityState["status"]
  training_frequency_target: string | null
  notes: string | null
  sort_key?: string | null
}

export type QualityStatePayload = {
  status: UserQualityState["status"]
  training_frequency_target: string | null
  notes: string | null
}

export type ProfileSortKeyPayload = {
  sort_key: string
}

export type SessionCreatePayload = {
  name?: string
  notes?: string | null
}

export type SessionUpdatePayload = {
  name?: string
  notes?: string | null
}

export type SupersetCreatePayload = {
  sessionId: string
  name: string | null
  sortKey: string
}

export type SupersetUpdatePayload = {
  name?: string | null
  sort_key?: string
}

export type UserLoggedExerciseWithExercise = UserLoggedExercise & {
  exercise_name: string
  exercise_notes: string | null
  exercise_image_url: string | null
  exercise_video_url: string | null
}

export type LoggedExerciseCreatePayload = {
  sessionId: string
  exerciseId: string
  supersetId: string | null
  sortKey: string
}

export type LoggedExerciseUpdatePayload = {
  sort_key?: string
}

export type ConversationCreatePayload = {
  title?: string
}

export type TouchConversationPayload = {
  conversationId: string
  title?: string
  lastMessageAt: string
}

export type ConversationUpdatePayload = {
  title?: string
  status?: UserConversation["status"]
}

export type UserProfilePayload = {
  about_me: string
}

function getErrorMessage(error: { message: string } | null) {
  return error?.message ?? "Unexpected error."
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>()
  const unique: string[] = []

  for (const value of values) {
    const trimmed = value.trim()
    const key = trimmed.toLowerCase()
    if (!trimmed || seen.has(key)) {
      continue
    }

    seen.add(key)
    unique.push(trimmed)
  }

  return unique
}

function isValidSortKey(sortKey: string | null) {
  if (!sortKey) {
    return false
  }

  try {
    generateKeyBetween(sortKey, null)
    return true
  } catch {
    return false
  }
}

function getLastValidSortKey(rows: { sort_key: string | null }[]) {
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const sortKey = rows[index].sort_key
    if (isValidSortKey(sortKey)) {
      return sortKey
    }
  }

  return null
}

async function ensureTaxonomyItems({
  supabase,
  userId,
  table,
  existingIds,
  customNames,
}: {
  supabase: ReturnType<typeof createClient>
  userId: string
  table: "user_exercise_types" | "user_body_regions"
  existingIds: string[]
  customNames: string[]
}) {
  const normalizedExistingIds = uniqueStrings(existingIds)
  const normalizedNames = uniqueStrings(customNames)

  if (normalizedNames.length === 0) {
    return { ids: normalizedExistingIds, error: null }
  }

  const { data: existingRows, error: existingError } = await supabase
    .from(table)
    .select("id,name")
    .eq("user_id", userId)
    .in("name", normalizedNames)

  if (existingError) {
    return { ids: [], error: getErrorMessage(existingError) }
  }

  const existingIdsByName = new Map(
    (existingRows ?? []).map((row) => [row.name.toLowerCase(), row.id])
  )
  const missingNames = normalizedNames.filter(
    (name) => !existingIdsByName.has(name.toLowerCase())
  )

  let createdIds: string[] = []
  if (missingNames.length > 0) {
    const { data: taxonomyRows, error: taxonomyRowsError } = await supabase
      .from(table)
      .select("sort_key")
      .eq("user_id", userId)
      .order("sort_key", { ascending: true })

    if (taxonomyRowsError) {
      return { ids: [], error: getErrorMessage(taxonomyRowsError) }
    }

    const sortKeys = generateNKeysBetween(
      getLastValidSortKey(taxonomyRows ?? []),
      null,
      missingNames.length
    )
    const { data: createdRows, error: createdError } = await supabase
      .from(table)
      .insert(
        missingNames.map((name, index) => ({
          user_id: userId,
          name,
          sort_key: sortKeys[index],
        }))
      )
      .select("id")

    if (createdError) {
      return { ids: [], error: getErrorMessage(createdError) }
    }

    createdIds = (createdRows ?? []).map((row) => row.id)
  }

  return {
    ids: Array.from(
      new Set([
        ...normalizedExistingIds,
        ...Array.from(existingIdsByName.values()),
        ...createdIds,
      ])
    ),
    error: null,
  }
}

async function ensureQualityItems({
  supabase,
  userId,
  existingIds,
  customNames,
}: {
  supabase: ReturnType<typeof createClient>
  userId: string
  existingIds: string[]
  customNames: string[]
}) {
  const normalizedExistingIds = uniqueStrings(existingIds)
  const normalizedNames = uniqueStrings(customNames)

  if (normalizedNames.length === 0) {
    return { ids: normalizedExistingIds, error: null }
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("user_qualities")
    .select("id,name")
    .eq("user_id", userId)
    .in("name", normalizedNames)

  if (existingError) {
    return { ids: [], error: getErrorMessage(existingError) }
  }

  const existingIdsByName = new Map(
    (existingRows ?? []).map((row) => [row.name.toLowerCase(), row.id])
  )
  const missingNames = normalizedNames.filter(
    (name) => !existingIdsByName.has(name.toLowerCase())
  )

  let createdIds: string[] = []
  if (missingNames.length > 0) {
    const { data: qualityRows, error: qualityRowsError } = await supabase
      .from("user_qualities")
      .select("sort_key")
      .eq("user_id", userId)
      .order("sort_key", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })

    if (qualityRowsError) {
      return { ids: [], error: getErrorMessage(qualityRowsError) }
    }

    const sortKeys = generateNKeysBetween(
      getLastValidSortKey(qualityRows ?? []),
      null,
      missingNames.length
    )
    const { data: createdRows, error: createdError } = await supabase
      .from("user_qualities")
      .insert(
        missingNames.map((name, index) => ({
          user_id: userId,
          name,
          body_region_id: null,
          display_color: null,
          sort_key: sortKeys[index],
        }))
      )
      .select("id")

    if (createdError) {
      return { ids: [], error: getErrorMessage(createdError) }
    }

    createdIds = (createdRows ?? []).map((row) => row.id)
  }

  return {
    ids: Array.from(
      new Set([
        ...normalizedExistingIds,
        ...Array.from(existingIdsByName.values()),
        ...createdIds,
      ])
    ),
    error: null,
  }
}

async function replaceAssignments({
  supabase,
  userId,
  exerciseId,
  table,
  idColumn,
  ids,
}: {
  supabase: ReturnType<typeof createClient>
  userId: string
  exerciseId: string
  table:
    | "user_exercise_type_assignments"
    | "user_exercise_quality_assignments"
  idColumn: "type_id" | "quality_id"
  ids: string[]
}) {
  const { error: deleteError } = await supabase
    .from(table)
    .delete()
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId)

  if (deleteError) {
    return getErrorMessage(deleteError)
  }

  const uniqueIds = uniqueStrings(ids)
  if (uniqueIds.length === 0) {
    return null
  }

  const { error: insertError } =
    table === "user_exercise_type_assignments" && idColumn === "type_id"
      ? await supabase.from("user_exercise_type_assignments").insert(
          uniqueIds.map((id) => ({
            user_id: userId,
            exercise_id: exerciseId,
            type_id: id,
          }))
        )
      : await supabase.from("user_exercise_quality_assignments").insert(
          uniqueIds.map((id) => ({
            user_id: userId,
            exercise_id: exerciseId,
            quality_id: id,
          }))
        )

  return insertError ? getErrorMessage(insertError) : null
}

async function saveExerciseAssignments({
  supabase,
  userId,
  exerciseId,
  payload,
}: {
  supabase: ReturnType<typeof createClient>
  userId: string
  exerciseId: string
  payload: ExercisePayload
}) {
  const typeResult = await ensureTaxonomyItems({
    supabase,
    userId,
    table: "user_exercise_types",
    existingIds: payload.types.existingIds,
    customNames: payload.types.customNames,
  })
  if (typeResult.error) {
    return typeResult.error
  }

  const typeAssignmentError = await replaceAssignments({
    supabase,
    userId,
    exerciseId,
    table: "user_exercise_type_assignments",
    idColumn: "type_id",
    ids: typeResult.ids,
  })
  if (typeAssignmentError) {
    return typeAssignmentError
  }

  const qualityResult = await ensureQualityItems({
    supabase,
    userId,
    existingIds: payload.qualities.existingIds,
    customNames: payload.qualities.customNames,
  })
  if (qualityResult.error) {
    return qualityResult.error
  }

  return replaceAssignments({
    supabase,
    userId,
    exerciseId,
    table: "user_exercise_quality_assignments",
    idColumn: "quality_id",
    ids: qualityResult.ids,
  })
}

function listTag(type: TrainingTagType) {
  return { type, id: "LIST" } as const
}

type TrainingTagType =
  | "Exercises"
  | "ExerciseTaxonomy"
  | "UserProfile"
  | "Issues"
  | "Qualities"
  | "QualityStates"
  | "Sessions"
  | "Supersets"
  | "LoggedExercises"
  | "Conversations"
  | "Messages"

export const trainingApi = createApi({
  reducerPath: "trainingApi",
  baseQuery: fakeBaseQuery<QueryError>(),
  tagTypes: [
    "Exercises",
    "ExerciseTaxonomy",
    "UserProfile",
    "Issues",
    "Qualities",
    "QualityStates",
    "Sessions",
    "Supersets",
    "LoggedExercises",
    "Conversations",
    "Messages",
  ],
  endpoints: (builder) => ({
    getUserProfile: builder.query<UserProfile | null, { userId: string }>({
      async queryFn({ userId }) {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle()

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: data ?? null }
      },
      providesTags: [listTag("UserProfile")],
    }),
    upsertUserProfile: builder.mutation<
      UserProfile,
      { userId: string; payload: UserProfilePayload }
    >({
      async queryFn({ userId, payload }) {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("user_profiles")
          .upsert(
            {
              user_id: userId,
              about_me: payload.about_me,
            },
            { onConflict: "user_id" }
          )
          .select("*")
          .single()

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data }
      },
      invalidatesTags: [listTag("UserProfile")],
    }),
    getExercises: builder.query<ExercisesResult, ExercisesQueryArgs>({
      async queryFn({
        userId,
        page,
        pageSize,
        searchQuery,
        typeIds,
        qualityIds,
      }) {
        const supabase = createClient()
        const normalizedSearchQuery = searchQuery.trim()
        const normalizedTypeIds = uniqueStrings(typeIds)
        const normalizedQualityIds = uniqueStrings(qualityIds)
        const normalizedPage = Math.max(1, page)
        const start = (normalizedPage - 1) * pageSize
        const end = start + pageSize - 1
        let filteredExerciseIds: Set<string> | null = null

        if (normalizedTypeIds.length > 0) {
          const { data: typeAssignments, error: typeAssignmentsError } =
            await supabase
              .from("user_exercise_type_assignments")
              .select("exercise_id")
              .eq("user_id", userId)
              .in("type_id", normalizedTypeIds)

          if (typeAssignmentsError) {
            return { error: getErrorMessage(typeAssignmentsError) }
          }

          filteredExerciseIds = new Set(
            (typeAssignments ?? []).map((assignment) => assignment.exercise_id)
          )
        }

        if (normalizedQualityIds.length > 0) {
          const { data: qualityAssignments, error: qualityAssignmentsError } =
            await supabase
            .from("user_exercise_quality_assignments")
            .select("exercise_id")
            .eq("user_id", userId)
            .in("quality_id", normalizedQualityIds)

          if (qualityAssignmentsError) {
            return { error: getErrorMessage(qualityAssignmentsError) }
          }

          const qualityExerciseIds = new Set(
            (qualityAssignments ?? []).map((assignment) => assignment.exercise_id)
          )
          filteredExerciseIds = filteredExerciseIds
            ? new Set(
                Array.from(filteredExerciseIds).filter((exerciseId) =>
                  qualityExerciseIds.has(exerciseId)
                )
              )
            : qualityExerciseIds
        }

        if (filteredExerciseIds && filteredExerciseIds.size === 0) {
          return {
            data: {
              exercises: [],
              totalCount: 0,
            },
          }
        }

        let query = supabase
          .from("user_exercises")
          .select("*", { count: "exact" })
          .eq("user_id", userId)

        if (filteredExerciseIds) {
          query = query.in("id", Array.from(filteredExerciseIds))
        }

        if (normalizedSearchQuery) {
          const wildcardQuery = `%${normalizedSearchQuery}%`
          query = query.or(
            `name.ilike.${wildcardQuery},notes.ilike.${wildcardQuery}`
          )
        }

        const { data, count, error } = await query
          .order("updated_at", { ascending: false })
          .range(start, end)

        if (error) {
          return { error: getErrorMessage(error) }
        }

        const exerciseRows = data ?? []
        const exerciseIds = exerciseRows.map((exercise) => exercise.id)
        const typeRowsByExerciseId = new Map<string, UserExerciseType[]>()
        const qualityRowsByExerciseId = new Map<string, UserQuality[]>()

        if (exerciseIds.length > 0) {
          const { data: typeAssignments, error: typeAssignmentsError } =
            await supabase
              .from("user_exercise_type_assignments")
              .select("exercise_id,type:user_exercise_types(*)")
              .eq("user_id", userId)
              .in("exercise_id", exerciseIds)

          if (typeAssignmentsError) {
            return { error: getErrorMessage(typeAssignmentsError) }
          }

          for (const assignment of (typeAssignments ?? []) as {
            exercise_id: string
            type: UserExerciseType | null
          }[]) {
            if (!assignment.type) {
              continue
            }

            const rows = typeRowsByExerciseId.get(assignment.exercise_id) ?? []
            rows.push(assignment.type)
            typeRowsByExerciseId.set(assignment.exercise_id, rows)
          }

          const { data: qualityAssignments, error: qualityAssignmentsError } =
            await supabase
            .from("user_exercise_quality_assignments")
            .select("exercise_id,quality:user_qualities(*)")
            .eq("user_id", userId)
            .in("exercise_id", exerciseIds)

          if (qualityAssignmentsError) {
            return { error: getErrorMessage(qualityAssignmentsError) }
          }

          for (const assignment of (qualityAssignments ?? []) as {
            exercise_id: string
            quality: UserQuality | null
          }[]) {
            if (!assignment.quality) {
              continue
            }

            const rows = qualityRowsByExerciseId.get(assignment.exercise_id) ?? []
            rows.push(assignment.quality)
            qualityRowsByExerciseId.set(assignment.exercise_id, rows)
          }
        }

        return {
          data: {
            exercises: exerciseRows.map((exercise) => ({
              ...exercise,
              types: typeRowsByExerciseId.get(exercise.id) ?? [],
              qualities: qualityRowsByExerciseId.get(exercise.id) ?? [],
            })),
            totalCount: count ?? 0,
          },
        }
      },
      providesTags: (result) => [
        listTag("Exercises"),
        ...(result?.exercises.map((exercise) => ({
          type: "Exercises" as const,
          id: exercise.id,
        })) ?? []),
      ],
    }),
    getExerciseTypes: builder.query<UserExerciseType[], { userId: string }>({
      async queryFn({ userId }) {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("user_exercise_types")
          .select("*")
          .eq("user_id", userId)
          .order("sort_key", { ascending: true })
          .order("name", { ascending: true })

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: data ?? [] }
      },
      providesTags: [listTag("ExerciseTaxonomy")],
    }),
    getExerciseBodyRegions: builder.query<
      UserBodyRegion[],
      { userId: string }
    >({
      async queryFn({ userId }) {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("user_body_regions")
          .select("*")
          .eq("user_id", userId)
          .order("sort_key", { ascending: true })
          .order("name", { ascending: true })

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: data ?? [] }
      },
      providesTags: [listTag("ExerciseTaxonomy")],
    }),
    updateExerciseTaxonomyItem: builder.mutation<
      UserExerciseType | UserBodyRegion,
      { userId: string; payload: ExerciseTaxonomyUpdatePayload }
    >({
      async queryFn({ userId, payload }) {
        const supabase = createClient()
        const updatePayload = {
          name: payload.name.trim(),
          description: payload.description,
          display_color: payload.display_color,
        }

        if (!updatePayload.name) {
          return { error: "Name is required." }
        }

        const table =
          payload.kind === "type"
            ? "user_exercise_types"
            : "user_body_regions"
        const { data, error } = await supabase
          .from(table)
          .update(updatePayload)
          .eq("user_id", userId)
          .eq("id", payload.itemId)
          .select("*")
          .single()

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data }
      },
      async onQueryStarted({ payload }, { dispatch, getState, queryFulfilled }) {
        const trimmedName = payload.name.trim()
        const optimisticUpdatedAt = new Date().toISOString()
        const taxonomyArgs =
          payload.kind === "type"
            ? trainingApi.util.selectCachedArgsForQuery(
                getState(),
                "getExerciseTypes"
              )
            : trainingApi.util.selectCachedArgsForQuery(
                getState(),
                "getExerciseBodyRegions"
              )
        const patches = [
          ...taxonomyArgs.map((args) =>
            dispatch(
              payload.kind === "type"
                ? trainingApi.util.updateQueryData(
                    "getExerciseTypes",
                    args,
                    (draft) => {
                      const item = draft.find(
                        (entry) => entry.id === payload.itemId
                      )
                      if (item) {
                        item.name = trimmedName
                        item.description = payload.description
                        item.display_color = payload.display_color
                        item.updated_at = optimisticUpdatedAt
                      }
                    }
                  )
                : trainingApi.util.updateQueryData(
                    "getExerciseBodyRegions",
                    args,
                    (draft) => {
                      const item = draft.find(
                        (entry) => entry.id === payload.itemId
                      )
                      if (item) {
                        item.name = trimmedName
                        item.description = payload.description
                        item.display_color = payload.display_color
                        item.updated_at = optimisticUpdatedAt
                      }
                    }
                  )
            )
          ),
          ...(payload.kind === "type"
            ? trainingApi.util.selectCachedArgsForQuery(
                getState(),
                "getExercises"
              )
            : []
          ).map((args) =>
            dispatch(
              trainingApi.util.updateQueryData("getExercises", args, (draft) => {
                for (const exercise of draft.exercises) {
                  for (const entry of exercise.types) {
                    if (entry.id === payload.itemId) {
                      entry.name = trimmedName
                      entry.description = payload.description
                      entry.display_color = payload.display_color
                      entry.updated_at = optimisticUpdatedAt
                    }
                  }
                }
              })
            )
          ),
        ]

        try {
          await queryFulfilled
        } catch {
          for (const patch of patches) {
            patch.undo()
          }
        }
      },
      invalidatesTags: [listTag("Exercises"), listTag("ExerciseTaxonomy")],
    }),
    createExerciseTaxonomyItem: builder.mutation<
      UserExerciseType | UserBodyRegion,
      { userId: string; payload: ExerciseTaxonomyCreatePayload }
    >({
      async queryFn({ userId, payload }) {
        const supabase = createClient()
        const name = payload.name.trim()

        if (!name) {
          return { error: "Name is required." }
        }

        const table =
          payload.kind === "type"
            ? "user_exercise_types"
            : "user_body_regions"
        const { data, error } = await supabase
          .from(table)
          .insert({
            user_id: userId,
            name,
            description: payload.description,
            display_color: payload.display_color,
            sort_key: payload.sort_key,
          })
          .select("*")
          .single()

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data }
      },
      invalidatesTags: [listTag("ExerciseTaxonomy")],
    }),
    updateExerciseTaxonomySortKey: builder.mutation<
      null,
      { userId: string; payload: ExerciseTaxonomySortPayload }
    >({
      async queryFn({ userId, payload }) {
        const supabase = createClient()
        const table =
          payload.kind === "type"
            ? "user_exercise_types"
            : "user_body_regions"
        const { error } = await supabase
          .from(table)
          .update({ sort_key: payload.sort_key })
          .eq("user_id", userId)
          .eq("id", payload.itemId)

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: null }
      },
      invalidatesTags: [listTag("ExerciseTaxonomy")],
    }),
    deleteExerciseTaxonomyItem: builder.mutation<
      null,
      { userId: string; payload: ExerciseTaxonomyDeletePayload }
    >({
      async queryFn({ userId, payload }) {
        const supabase = createClient()
        const table =
          payload.kind === "type"
            ? "user_exercise_types"
            : "user_body_regions"
        const { error } = await supabase
          .from(table)
          .delete()
          .eq("user_id", userId)
          .eq("id", payload.itemId)

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: null }
      },
      invalidatesTags: [listTag("Exercises"), listTag("ExerciseTaxonomy")],
    }),
    createExercise: builder.mutation<
      UserExerciseWithTaxonomy | null,
      { userId: string; payload: ExercisePayload }
    >({
      async queryFn({ userId, payload }) {
        const supabase = createClient()
        const exercisePayload = {
          name: payload.name,
          notes: payload.notes,
          image_url: payload.image_url,
          video_url: payload.video_url,
          performance: payload.performance,
        }
        const { data, error } = await supabase
          .from("user_exercises")
          .insert({ user_id: userId, ...exercisePayload })
          .select("*")
          .single()

        if (error) {
          return { error: getErrorMessage(error) }
        }

        const assignmentError = await saveExerciseAssignments({
          supabase,
          userId,
          exerciseId: data.id,
          payload,
        })
        if (assignmentError) {
          return { error: assignmentError }
        }

        return { data: { ...data, types: [], qualities: [] } }
      },
      invalidatesTags: [listTag("Exercises"), listTag("ExerciseTaxonomy")],
    }),
    updateExercise: builder.mutation<null, ExerciseUpdateMutationArgs>({
      async queryFn({ userId, exerciseId, payload }) {
        const supabase = createClient()
        const exercisePayload = {
          name: payload.name,
          notes: payload.notes,
          image_url: payload.image_url,
          video_url: payload.video_url,
          performance: payload.performance,
        }
        const { error } = await supabase
          .from("user_exercises")
          .update(exercisePayload)
          .eq("id", exerciseId)
          .eq("user_id", userId)

        if (error) {
          return { error: getErrorMessage(error) }
        }

        const assignmentError = await saveExerciseAssignments({
          supabase,
          userId,
          exerciseId,
          payload,
        })
        if (assignmentError) {
          return { error: assignmentError }
        }

        return { data: null }
      },
      async onQueryStarted(
        { exerciseId, optimisticExercise },
        { dispatch, getState, queryFulfilled }
      ) {
        const cachedArgs = trainingApi.util.selectCachedArgsForQuery(
          getState(),
          "getExercises"
        )
        const patches = optimisticExercise
          ? cachedArgs.map((args) =>
              dispatch(
                trainingApi.util.updateQueryData(
                  "getExercises",
                  args,
                  (draft) => {
                    const exercise = draft.exercises.find(
                      (entry) => entry.id === exerciseId
                    )
                    if (exercise) {
                      Object.assign(exercise, optimisticExercise)
                    }
                  }
                )
              )
            )
          : []

        try {
          await queryFulfilled
        } catch {
          for (const patch of patches) {
            patch.undo()
          }
        }
      },
      invalidatesTags: (_result, _error, { exerciseId }) => [
        listTag("Exercises"),
        listTag("ExerciseTaxonomy"),
        { type: "Exercises", id: exerciseId },
      ],
    }),
    updateExerciseVideoUrl: builder.mutation<null, ExerciseVideoUrlMutationArgs>({
      async queryFn({ userId, exerciseId, payload }) {
        const supabase = createClient()
        const { error } = await supabase
          .from("user_exercises")
          .update({ video_url: payload.video_url })
          .eq("id", exerciseId)
          .eq("user_id", userId)

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: null }
      },
      async onQueryStarted(
        { exerciseId, payload },
        { dispatch, getState, queryFulfilled }
      ) {
        const optimisticUpdatedAt = new Date().toISOString()
        const cachedArgs = trainingApi.util.selectCachedArgsForQuery(
          getState(),
          "getExercises"
        )
        const patches = cachedArgs.map((args) =>
          dispatch(
            trainingApi.util.updateQueryData("getExercises", args, (draft) => {
              const exercise = draft.exercises.find(
                (entry) => entry.id === exerciseId
              )
              if (exercise) {
                exercise.video_url = payload.video_url
                exercise.updated_at = optimisticUpdatedAt
              }
            })
          )
        )

        try {
          await queryFulfilled
        } catch {
          for (const patch of patches) {
            patch.undo()
          }
        }
      },
      invalidatesTags: (_result, _error, { exerciseId }) => [
        listTag("Exercises"),
        { type: "Exercises", id: exerciseId },
      ],
    }),
    updateExerciseImageUrl: builder.mutation<null, ExerciseImageUrlMutationArgs>({
      async queryFn({ userId, exerciseId, payload }) {
        const supabase = createClient()
        const { error } = await supabase
          .from("user_exercises")
          .update({ image_url: payload.image_url })
          .eq("id", exerciseId)
          .eq("user_id", userId)

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: null }
      },
      async onQueryStarted(
        { exerciseId, payload },
        { dispatch, getState, queryFulfilled }
      ) {
        const optimisticUpdatedAt = new Date().toISOString()
        const cachedArgs = trainingApi.util.selectCachedArgsForQuery(
          getState(),
          "getExercises"
        )
        const patches = cachedArgs.map((args) =>
          dispatch(
            trainingApi.util.updateQueryData("getExercises", args, (draft) => {
              const exercise = draft.exercises.find(
                (entry) => entry.id === exerciseId
              )
              if (exercise) {
                exercise.image_url = payload.image_url
                exercise.updated_at = optimisticUpdatedAt
              }
            })
          )
        )

        try {
          await queryFulfilled
        } catch {
          for (const patch of patches) {
            patch.undo()
          }
        }
      },
      invalidatesTags: (_result, _error, { exerciseId }) => [
        listTag("Exercises"),
        { type: "Exercises", id: exerciseId },
      ],
    }),
    deleteExercise: builder.mutation<
      null,
      { userId: string; exerciseId: string }
    >({
      async queryFn({ userId, exerciseId }) {
        const supabase = createClient()
        const { error } = await supabase
          .from("user_exercises")
          .delete()
          .eq("id", exerciseId)
          .eq("user_id", userId)

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: null }
      },
      invalidatesTags: (_result, _error, { exerciseId }) => [
        listTag("Exercises"),
        listTag("ExerciseTaxonomy"),
        { type: "Exercises", id: exerciseId },
      ],
    }),
    getIssues: builder.query<UserIssue[], { userId: string }>({
      async queryFn({ userId }) {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("user_issues")
          .select("*")
          .eq("user_id", userId)
          .order("sort_key", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: true })

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: data ?? [] }
      },
      providesTags: (result) => [
        listTag("Issues"),
        ...(result?.map((issue) => ({
          type: "Issues" as const,
          id: issue.id,
        })) ?? []),
      ],
    }),
    createIssue: builder.mutation<
      UserIssue,
      { userId: string; payload: IssuePayload }
    >({
      async queryFn({ userId, payload }) {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("user_issues")
          .insert({ user_id: userId, ...payload })
          .select("*")
          .single()

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data }
      },
      invalidatesTags: [listTag("Issues")],
    }),
    updateIssue: builder.mutation<
      null,
      { userId: string; issueId: string; payload: IssuePayload }
    >({
      async queryFn({ userId, issueId, payload }) {
        const supabase = createClient()
        const { error } = await supabase
          .from("user_issues")
          .update({
            ...payload,
            last_noted_at: new Date().toISOString(),
          })
          .eq("id", issueId)
          .eq("user_id", userId)

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: null }
      },
      invalidatesTags: (_result, _error, { issueId }) => [
        listTag("Issues"),
        { type: "Issues", id: issueId },
      ],
    }),
    updateIssueSortKey: builder.mutation<
      null,
      { userId: string; issueId: string; payload: ProfileSortKeyPayload }
    >({
      async queryFn({ userId, issueId, payload }) {
        const supabase = createClient()
        const { error } = await supabase
          .from("user_issues")
          .update(payload)
          .eq("id", issueId)
          .eq("user_id", userId)

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: null }
      },
      invalidatesTags: (_result, _error, { issueId }) => [
        listTag("Issues"),
        { type: "Issues", id: issueId },
      ],
    }),
    deleteIssue: builder.mutation<null, { userId: string; issueId: string }>({
      async queryFn({ userId, issueId }) {
        const supabase = createClient()
        const { error } = await supabase
          .from("user_issues")
          .delete()
          .eq("id", issueId)
          .eq("user_id", userId)

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: null }
      },
      invalidatesTags: (_result, _error, { issueId }) => [
        listTag("Issues"),
        { type: "Issues", id: issueId },
      ],
    }),
    getQualities: builder.query<UserQuality[], { userId: string }>({
      async queryFn({ userId }) {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("user_qualities")
          .select("*")
          .eq("user_id", userId)
          .order("sort_key", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: true })

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: data ?? [] }
      },
      providesTags: (result) => [
        listTag("Qualities"),
        ...(result?.map((quality) => ({
          type: "Qualities" as const,
          id: quality.id,
        })) ?? []),
      ],
    }),
    createQuality: builder.mutation<
      UserQuality,
      { userId: string; payload: QualityPayload }
    >({
      async queryFn({ userId, payload }) {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("user_qualities")
          .insert({ user_id: userId, ...payload })
          .select("*")
          .single()

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data }
      },
      invalidatesTags: [listTag("Qualities"), listTag("Exercises")],
    }),
    updateQuality: builder.mutation<
      null,
      { userId: string; qualityId: string; payload: QualityPayload }
    >({
      async queryFn({ userId, qualityId, payload }) {
        const supabase = createClient()
        const { error } = await supabase
          .from("user_qualities")
          .update(payload)
          .eq("id", qualityId)
          .eq("user_id", userId)

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: null }
      },
      async onQueryStarted(
        { qualityId, payload },
        { dispatch, getState, queryFulfilled }
      ) {
        const optimisticUpdatedAt = new Date().toISOString()
        const patchQuality = (quality: UserQuality) => {
          quality.name = payload.name
          quality.description = payload.description
          quality.body_region_id = payload.body_region_id
          quality.display_color = payload.display_color
          if (payload.sort_key !== undefined) {
            quality.sort_key = payload.sort_key
          }
          quality.updated_at = optimisticUpdatedAt
        }
        const patches = [
          ...trainingApi.util
            .selectCachedArgsForQuery(getState(), "getQualities")
            .map((args) =>
              dispatch(
                trainingApi.util.updateQueryData(
                  "getQualities",
                  args,
                  (draft) => {
                    const quality = draft.find(
                      (entry) => entry.id === qualityId
                    )
                    if (quality) {
                      patchQuality(quality)
                    }
                  }
                )
              )
            ),
          ...trainingApi.util
            .selectCachedArgsForQuery(getState(), "getExercises")
            .map((args) =>
              dispatch(
                trainingApi.util.updateQueryData(
                  "getExercises",
                  args,
                  (draft) => {
                    for (const exercise of draft.exercises) {
                      for (const quality of exercise.qualities) {
                        if (quality.id === qualityId) {
                          patchQuality(quality)
                        }
                      }
                    }
                  }
                )
              )
            ),
          ...trainingApi.util
            .selectCachedArgsForQuery(getState(), "getQualityStates")
            .map((args) =>
              dispatch(
                trainingApi.util.updateQueryData(
                  "getQualityStates",
                  args,
                  (draft) => {
                    for (const state of draft) {
                      if (state.quality.id === qualityId) {
                        patchQuality(state.quality)
                      }
                    }
                  }
                )
              )
            ),
        ]

        try {
          await queryFulfilled
        } catch {
          for (const patch of patches) {
            patch.undo()
          }
        }
      },
      invalidatesTags: (_result, _error, { qualityId }) => [
        listTag("Qualities"),
        listTag("Exercises"),
        listTag("QualityStates"),
        { type: "Qualities", id: qualityId },
      ],
    }),
    updateQualitySortKey: builder.mutation<
      null,
      { userId: string; qualityId: string; payload: ProfileSortKeyPayload }
    >({
      async queryFn({ userId, qualityId, payload }) {
        const supabase = createClient()
        const { error } = await supabase
          .from("user_qualities")
          .update(payload)
          .eq("id", qualityId)
          .eq("user_id", userId)

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: null }
      },
      invalidatesTags: (_result, _error, { qualityId }) => [
        listTag("Qualities"),
        { type: "Qualities", id: qualityId },
        listTag("Exercises"),
      ],
    }),
    deleteQuality: builder.mutation<
      null,
      { userId: string; qualityId: string }
    >({
      async queryFn({ userId, qualityId }) {
        const supabase = createClient()
        const { error } = await supabase
          .from("user_qualities")
          .delete()
          .eq("id", qualityId)
          .eq("user_id", userId)

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: null }
      },
      invalidatesTags: (_result, _error, { qualityId }) => [
        listTag("Qualities"),
        { type: "Qualities", id: qualityId },
        listTag("Exercises"),
        listTag("QualityStates"),
      ],
    }),
    getQualityStates: builder.query<
      UserQualityStateWithQuality[],
      { userId: string }
    >({
      async queryFn({ userId }) {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("user_quality_states")
          .select("*, quality:user_qualities(*)")
          .eq("user_id", userId)
          .order("sort_key", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: true })

        if (error) {
          return { error: getErrorMessage(error) }
        }

        const states = ((data ?? []) as (UserQualityState & {
          quality: UserQuality | null
        })[]).filter(
          (state): state is UserQualityStateWithQuality =>
            state.quality !== null
        )

        return { data: states }
      },
      providesTags: (result) => [
        listTag("QualityStates"),
        ...(result?.map((state) => ({
          type: "QualityStates" as const,
          id: state.id,
        })) ?? []),
      ],
    }),
    createQualityState: builder.mutation<
      UserQualityStateWithQuality,
      { userId: string; payload: QualityStateCreatePayload }
    >({
      async queryFn({ userId, payload }) {
        const supabase = createClient()
        const name = payload.name.trim()
        let qualityId = payload.quality_id ?? null

        if (!qualityId) {
          const { data: existingQualities, error: existingError } = await supabase
            .from("user_qualities")
            .select("id")
            .eq("user_id", userId)
            .ilike("name", name)
            .limit(1)

          if (existingError) {
            return { error: getErrorMessage(existingError) }
          }

          qualityId = existingQualities?.[0]?.id ?? null
        }

        if (!qualityId) {
          const { data: qualityRows, error: qualityRowsError } = await supabase
            .from("user_qualities")
            .select("sort_key")
            .eq("user_id", userId)
            .order("sort_key", { ascending: true, nullsFirst: false })
            .order("created_at", { ascending: true })

          if (qualityRowsError) {
            return { error: getErrorMessage(qualityRowsError) }
          }

          const { data: createdQuality, error: createQualityError } =
            await supabase
              .from("user_qualities")
              .insert({
                user_id: userId,
                name,
                description: null,
                body_region_id: null,
                display_color: null,
                sort_key: generateKeyBetween(
                  getLastValidSortKey(qualityRows ?? []),
                  null
                ),
              })
              .select("id")
              .single()

          if (createQualityError) {
            return { error: getErrorMessage(createQualityError) }
          }

          qualityId = createdQuality.id
        }

        const { data: existingState, error: existingStateError } =
          await supabase
            .from("user_quality_states")
            .select("id")
            .eq("user_id", userId)
            .eq("quality_id", qualityId)
            .maybeSingle()

        if (existingStateError) {
          return { error: getErrorMessage(existingStateError) }
        }

        if (existingState) {
          const { data, error } = await supabase
            .from("user_quality_states")
            .update({
              status: payload.status,
              training_frequency_target: payload.training_frequency_target,
              notes: payload.notes,
              sort_key: payload.sort_key ?? null,
            })
            .eq("id", existingState.id)
            .eq("user_id", userId)
            .select("*, quality:user_qualities(*)")
            .single()

          if (error) {
            return { error: getErrorMessage(error) }
          }

          return { data: data as UserQualityStateWithQuality }
        }

        const { data, error } = await supabase
          .from("user_quality_states")
          .insert({
            user_id: userId,
            quality_id: qualityId,
            status: payload.status,
            training_frequency_target: payload.training_frequency_target,
            notes: payload.notes,
            sort_key: payload.sort_key ?? null,
          })
          .select("*, quality:user_qualities(*)")
          .single()

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: data as UserQualityStateWithQuality }
      },
      invalidatesTags: [
        listTag("QualityStates"),
        listTag("Qualities"),
        listTag("Exercises"),
      ],
    }),
    updateQualityState: builder.mutation<
      null,
      { userId: string; stateId: string; payload: QualityStatePayload }
    >({
      async queryFn({ userId, stateId, payload }) {
        const supabase = createClient()
        const { error } = await supabase
          .from("user_quality_states")
          .update(payload)
          .eq("id", stateId)
          .eq("user_id", userId)

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: null }
      },
      invalidatesTags: (_result, _error, { stateId }) => [
        listTag("QualityStates"),
        { type: "QualityStates", id: stateId },
      ],
    }),
    updateQualityStateSortKey: builder.mutation<
      null,
      { userId: string; stateId: string; payload: ProfileSortKeyPayload }
    >({
      async queryFn({ userId, stateId, payload }) {
        const supabase = createClient()
        const { error } = await supabase
          .from("user_quality_states")
          .update(payload)
          .eq("id", stateId)
          .eq("user_id", userId)

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: null }
      },
      invalidatesTags: (_result, _error, { stateId }) => [
        listTag("QualityStates"),
        { type: "QualityStates", id: stateId },
      ],
    }),
    deleteQualityState: builder.mutation<
      null,
      { userId: string; stateId: string }
    >({
      async queryFn({ userId, stateId }) {
        const supabase = createClient()
        const { error } = await supabase
          .from("user_quality_states")
          .delete()
          .eq("id", stateId)
          .eq("user_id", userId)

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: null }
      },
      invalidatesTags: (_result, _error, { stateId }) => [
        listTag("QualityStates"),
        { type: "QualityStates", id: stateId },
      ],
    }),
    getSessions: builder.query<UserSession[], { userId: string }>({
      async queryFn({ userId }) {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("user_sessions")
          .select("*")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: data ?? [] }
      },
      providesTags: (result) => [
        listTag("Sessions"),
        ...(result?.map((session) => ({
          type: "Sessions" as const,
          id: session.id,
        })) ?? []),
      ],
    }),
    createSession: builder.mutation<
      UserSession,
      { userId: string; payload?: SessionCreatePayload }
    >({
      async queryFn({ userId, payload = {} }) {
        const supabase = createClient()
        const today = new Date().toISOString().slice(0, 10)
        const sessionName = payload.name ?? `Untitled session - ${today}`
        const { data, error } = await supabase
          .from("user_sessions")
          .insert({
            user_id: userId,
            name: sessionName,
            notes: payload.notes ?? null,
            type: "template",
            date: today,
            estimated_duration_mins: null,
          })
          .select("*")
          .single()

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data }
      },
      invalidatesTags: [listTag("Sessions")],
    }),
    updateSession: builder.mutation<
      null,
      { userId: string; sessionId: string; payload: SessionUpdatePayload }
    >({
      async queryFn({ userId, sessionId, payload }) {
        const supabase = createClient()
        const { error } = await supabase
          .from("user_sessions")
          .update(payload)
          .eq("id", sessionId)
          .eq("user_id", userId)

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: null }
      },
      invalidatesTags: (_result, _error, { sessionId }) => [
        listTag("Sessions"),
        { type: "Sessions", id: sessionId },
      ],
    }),
    deleteSession: builder.mutation<
      null,
      { userId: string; sessionId: string }
    >({
      async queryFn({ userId, sessionId }) {
        const supabase = createClient()
        const { error } = await supabase
          .from("user_sessions")
          .delete()
          .eq("id", sessionId)
          .eq("user_id", userId)

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: null }
      },
      invalidatesTags: (_result, _error, { sessionId }) => [
        listTag("Sessions"),
        { type: "Sessions", id: sessionId },
        listTag("Supersets"),
        listTag("LoggedExercises"),
      ],
    }),
    getSupersets: builder.query<
      UserSuperset[],
      { userId: string; sessionId: string }
    >({
      async queryFn({ userId, sessionId }) {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("user_supersets")
          .select("*")
          .eq("user_id", userId)
          .eq("session_id", sessionId)
          .order("sort_key", { ascending: true })

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: data ?? [] }
      },
      providesTags: (result, _error, { sessionId }) => [
        listTag("Supersets"),
        { type: "Supersets", id: sessionId },
        ...(result?.map((superset) => ({
          type: "Supersets" as const,
          id: superset.id,
        })) ?? []),
      ],
    }),
    createSuperset: builder.mutation<
      UserSuperset,
      { userId: string; payload: SupersetCreatePayload }
    >({
      async queryFn({ userId, payload }) {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("user_supersets")
          .insert({
            user_id: userId,
            session_id: payload.sessionId,
            name: payload.name,
            sort_key: payload.sortKey,
          })
          .select("*")
          .single()

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data }
      },
      invalidatesTags: (_result, _error, { payload }) => [
        listTag("Supersets"),
        { type: "Supersets", id: payload.sessionId },
      ],
    }),
    updateSuperset: builder.mutation<
      null,
      { userId: string; supersetId: string; payload: SupersetUpdatePayload }
    >({
      async queryFn({ userId, supersetId, payload }) {
        const supabase = createClient()
        const { error } = await supabase
          .from("user_supersets")
          .update(payload)
          .eq("id", supersetId)
          .eq("user_id", userId)

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: null }
      },
      invalidatesTags: (_result, _error, { supersetId }) => [
        listTag("Supersets"),
        { type: "Supersets", id: supersetId },
      ],
    }),
    deleteSuperset: builder.mutation<
      null,
      { userId: string; sessionId: string; supersetId: string }
    >({
      async queryFn({ userId, supersetId }) {
        const supabase = createClient()
        const { error } = await supabase
          .from("user_supersets")
          .delete()
          .eq("id", supersetId)
          .eq("user_id", userId)

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: null }
      },
      invalidatesTags: (_result, _error, { sessionId, supersetId }) => [
        listTag("Supersets"),
        { type: "Supersets", id: sessionId },
        { type: "Supersets", id: supersetId },
        { type: "LoggedExercises", id: sessionId },
      ],
    }),
    getLoggedExercises: builder.query<
      UserLoggedExerciseWithExercise[],
      { userId: string; sessionId: string }
    >({
      async queryFn({ userId, sessionId }) {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("user_logged_exercises")
          .select("*")
          .eq("user_id", userId)
          .eq("session_id", sessionId)
          .order("sort_key", { ascending: true })

        if (error) {
          return { error: getErrorMessage(error) }
        }

        const rows = data ?? []
        const exerciseIds = Array.from(new Set(rows.map((row) => row.exercise_id)))
        const exerciseNamesById = new Map<string, string>()
        const exerciseNotesById = new Map<string, string | null>()
        const exerciseImageUrlsById = new Map<string, string | null>()
        const exerciseVideoUrlsById = new Map<string, string | null>()

        if (exerciseIds.length > 0) {
          const { data: exerciseRows, error: exerciseError } = await supabase
            .from("user_exercises")
            .select("id,name,notes,image_url,video_url")
            .eq("user_id", userId)
            .in("id", exerciseIds)

          if (exerciseError) {
            return { error: getErrorMessage(exerciseError) }
          }

          for (const exercise of exerciseRows ?? []) {
            exerciseNamesById.set(exercise.id, exercise.name)
            exerciseNotesById.set(exercise.id, exercise.notes)
            exerciseImageUrlsById.set(exercise.id, exercise.image_url)
            exerciseVideoUrlsById.set(exercise.id, exercise.video_url)
          }
        }

        return {
          data: rows.map((row) => ({
            ...row,
            exercise_name:
              exerciseNamesById.get(row.exercise_id) ?? "Unknown exercise",
            exercise_notes: exerciseNotesById.get(row.exercise_id) ?? null,
            exercise_image_url:
              exerciseImageUrlsById.get(row.exercise_id) ?? null,
            exercise_video_url:
              exerciseVideoUrlsById.get(row.exercise_id) ?? null,
          })),
        }
      },
      providesTags: (result, _error, { sessionId }) => [
        listTag("LoggedExercises"),
        { type: "LoggedExercises", id: sessionId },
        ...(result?.map((loggedExercise) => ({
          type: "LoggedExercises" as const,
          id: loggedExercise.id,
        })) ?? []),
      ],
    }),
    createLoggedExercise: builder.mutation<
      UserLoggedExercise,
      { userId: string; payload: LoggedExerciseCreatePayload }
    >({
      async queryFn({ userId, payload }) {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("user_logged_exercises")
          .insert({
            user_id: userId,
            session_id: payload.sessionId,
            superset_id: payload.supersetId,
            exercise_id: payload.exerciseId,
            sort_key: payload.sortKey,
          })
          .select("*")
          .single()

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data }
      },
      invalidatesTags: (_result, _error, { payload }) => [
        listTag("LoggedExercises"),
        { type: "LoggedExercises", id: payload.sessionId },
      ],
    }),
    updateLoggedExercise: builder.mutation<
      null,
      {
        userId: string
        sessionId: string
        loggedExerciseId: string
        payload: LoggedExerciseUpdatePayload
      }
    >({
      async queryFn({ userId, loggedExerciseId, payload }) {
        const supabase = createClient()
        const { error } = await supabase
          .from("user_logged_exercises")
          .update(payload)
          .eq("id", loggedExerciseId)
          .eq("user_id", userId)

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: null }
      },
      invalidatesTags: (_result, _error, { sessionId, loggedExerciseId }) => [
        listTag("LoggedExercises"),
        { type: "LoggedExercises", id: sessionId },
        { type: "LoggedExercises", id: loggedExerciseId },
      ],
    }),
    getConversations: builder.query<
      UserConversation[],
      { userId: string; limit: number }
    >({
      async queryFn({ userId, limit }) {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("user_conversations")
          .select("*")
          .eq("user_id", userId)
          .neq("status", "deleted")
          .order("updated_at", { ascending: false })
          .limit(limit)

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: data ?? [] }
      },
      providesTags: (result) => [
        listTag("Conversations"),
        ...(result?.map((conversation) => ({
          type: "Conversations" as const,
          id: conversation.id,
        })) ?? []),
      ],
    }),
    createConversation: builder.mutation<
      UserConversation,
      { userId: string; payload?: ConversationCreatePayload }
    >({
      async queryFn({ userId, payload = {} }) {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("user_conversations")
          .insert({
            user_id: userId,
            title: payload.title ?? "New conversation",
            status: "active",
          })
          .select("*")
          .single()

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data }
      },
      async onQueryStarted({ userId }, { dispatch, getState, queryFulfilled }) {
        let conversation: UserConversation

        try {
          const fulfilled = await queryFulfilled
          conversation = fulfilled.data
        } catch {
          return
        }

        const cachedConversationLists = trainingApi.util.selectInvalidatedBy(
          getState(),
          [listTag("Conversations")]
        )

        for (const cacheEntry of cachedConversationLists) {
          if (cacheEntry.endpointName !== "getConversations") {
            continue
          }

          const args = cacheEntry.originalArgs as
            | { userId: string; limit: number }
            | undefined

          if (!args || args.userId !== userId) {
            continue
          }

          dispatch(
            trainingApi.util.updateQueryData(
              "getConversations",
              args,
              (draft) => {
                if (draft.some((item) => item.id === conversation.id)) {
                  return
                }

                draft.unshift(conversation)

                if (draft.length > args.limit) {
                  draft.length = args.limit
                }
              }
            )
          )
        }
      },
      invalidatesTags: [listTag("Conversations")],
    }),
    touchConversation: builder.mutation<
      null,
      { userId: string; payload: TouchConversationPayload }
    >({
      async queryFn({ userId, payload }) {
        const supabase = createClient()
        const updatePayload: {
          last_message_at: string
          title?: string
        } = {
          last_message_at: payload.lastMessageAt,
        }

        if (payload.title) {
          updatePayload.title = payload.title
        }

        const { error } = await supabase
          .from("user_conversations")
          .update(updatePayload)
          .eq("id", payload.conversationId)
          .eq("user_id", userId)

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: null }
      },
      invalidatesTags: (_result, _error, { payload }) => [
        listTag("Conversations"),
        { type: "Conversations", id: payload.conversationId },
      ],
    }),
    updateConversation: builder.mutation<
      null,
      {
        userId: string
        conversationId: string
        payload: ConversationUpdatePayload
      }
    >({
      async queryFn({ userId, conversationId, payload }) {
        const supabase = createClient()
        const { error } = await supabase
          .from("user_conversations")
          .update(payload)
          .eq("id", conversationId)
          .eq("user_id", userId)

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: null }
      },
      invalidatesTags: (_result, _error, { conversationId }) => [
        listTag("Conversations"),
        { type: "Conversations", id: conversationId },
      ],
    }),
    deleteConversation: builder.mutation<
      null,
      { userId: string; conversationId: string }
    >({
      async queryFn({ userId, conversationId }) {
        const supabase = createClient()
        const { error } = await supabase
          .from("user_conversations")
          .update({ status: "deleted" })
          .eq("id", conversationId)
          .eq("user_id", userId)

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: null }
      },
      invalidatesTags: (_result, _error, { conversationId }) => [
        listTag("Conversations"),
        { type: "Conversations", id: conversationId },
        { type: "Messages", id: conversationId },
      ],
    }),
    getMessages: builder.query<
      UserMessage[],
      { userId: string; conversationId: string }
    >({
      async queryFn({ userId, conversationId }) {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("user_messages")
          .select("*")
          .eq("user_id", userId)
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })
          .order("id", { ascending: true })

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data: data ?? [] }
      },
      providesTags: (result, _error, { conversationId }) => [
        listTag("Messages"),
        { type: "Messages", id: conversationId },
        ...(result?.map((message) => ({
          type: "Messages" as const,
          id: message.id,
        })) ?? []),
      ],
    }),
    createMessage: builder.mutation<
      UserMessage,
      { userId: string; conversationId: string; content: string }
    >({
      async queryFn({ userId, conversationId, content }) {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("user_messages")
          .insert({
            user_id: userId,
            conversation_id: conversationId,
            role: "user",
            status: "complete",
            content,
          })
          .select("*")
          .single()

        if (error) {
          return { error: getErrorMessage(error) }
        }

        return { data }
      },
      invalidatesTags: (_result, _error, { conversationId }) => [
        listTag("Messages"),
        { type: "Messages", id: conversationId },
      ],
    }),
  }),
})

export const {
  useGetUserProfileQuery,
  useUpsertUserProfileMutation,
  useGetExercisesQuery,
  useGetExerciseTypesQuery,
  useGetExerciseBodyRegionsQuery,
  useUpdateExerciseTaxonomyItemMutation,
  useCreateExerciseTaxonomyItemMutation,
  useUpdateExerciseTaxonomySortKeyMutation,
  useDeleteExerciseTaxonomyItemMutation,
  useCreateExerciseMutation,
  useUpdateExerciseMutation,
  useUpdateExerciseImageUrlMutation,
  useUpdateExerciseVideoUrlMutation,
  useDeleteExerciseMutation,
  useGetIssuesQuery,
  useCreateIssueMutation,
  useUpdateIssueMutation,
  useUpdateIssueSortKeyMutation,
  useDeleteIssueMutation,
  useGetQualitiesQuery,
  useCreateQualityMutation,
  useUpdateQualityMutation,
  useUpdateQualitySortKeyMutation,
  useDeleteQualityMutation,
  useGetQualityStatesQuery,
  useCreateQualityStateMutation,
  useUpdateQualityStateMutation,
  useUpdateQualityStateSortKeyMutation,
  useDeleteQualityStateMutation,
  useGetSessionsQuery,
  useCreateSessionMutation,
  useUpdateSessionMutation,
  useDeleteSessionMutation,
  useGetSupersetsQuery,
  useCreateSupersetMutation,
  useUpdateSupersetMutation,
  useDeleteSupersetMutation,
  useGetLoggedExercisesQuery,
  useCreateLoggedExerciseMutation,
  useUpdateLoggedExerciseMutation,
  useGetConversationsQuery,
  useCreateConversationMutation,
  useTouchConversationMutation,
  useUpdateConversationMutation,
  useDeleteConversationMutation,
  useGetMessagesQuery,
  useCreateMessageMutation,
} = trainingApi
