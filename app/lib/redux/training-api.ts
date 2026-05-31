"use client"

import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing"

import { createClient } from "@/lib/supabase/client"
import type {
  Json,
  UserConversation,
  UserExercise,
  UserExerciseBodyRegion,
  UserExerciseType,
  UserIssue,
  UserLoggedExercise,
  UserMessage,
  UserQuality,
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
  body_regions: ExerciseTaxonomyPayload
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

export type ExercisesQueryArgs = {
  userId: string
  page: number
  pageSize: number
  searchQuery: string
}

export type ExercisesResult = {
  exercises: UserExerciseWithTaxonomy[]
  totalCount: number
}

export type UserExerciseWithTaxonomy = UserExercise & {
  types: UserExerciseType[]
  body_regions: UserExerciseBodyRegion[]
}

export type IssuePayload = {
  name: string
  notes: string | null
  status: UserIssue["status"]
  sort_key?: string | null
}

export type QualityPayload = {
  name: string
  notes: string | null
  body_region: string | null
  status: UserQuality["status"]
  sort_key?: string | null
  training_frequency_target: string | null
  training_goal: string | null
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
}

export type LoggedExerciseCreatePayload = {
  sessionId: string
  exerciseId: string
  supersetId: string | null
  sortKey: string
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
  table: "user_exercise_types" | "user_exercise_body_regions"
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
    | "user_exercise_body_region_assignments"
  idColumn: "type_id" | "body_region_id"
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
      : await supabase.from("user_exercise_body_region_assignments").insert(
          uniqueIds.map((id) => ({
            user_id: userId,
            exercise_id: exerciseId,
            body_region_id: id,
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

  const bodyRegionResult = await ensureTaxonomyItems({
    supabase,
    userId,
    table: "user_exercise_body_regions",
    existingIds: payload.body_regions.existingIds,
    customNames: payload.body_regions.customNames,
  })
  if (bodyRegionResult.error) {
    return bodyRegionResult.error
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

  return replaceAssignments({
    supabase,
    userId,
    exerciseId,
    table: "user_exercise_body_region_assignments",
    idColumn: "body_region_id",
    ids: bodyRegionResult.ids,
  })
}

function listTag(type: TrainingTagType) {
  return { type, id: "LIST" } as const
}

type TrainingTagType =
  | "Exercises"
  | "ExerciseTaxonomy"
  | "Issues"
  | "Qualities"
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
    "Issues",
    "Qualities",
    "Sessions",
    "Supersets",
    "LoggedExercises",
    "Conversations",
    "Messages",
  ],
  endpoints: (builder) => ({
    getExercises: builder.query<ExercisesResult, ExercisesQueryArgs>({
      async queryFn({ userId, page, pageSize, searchQuery }) {
        const supabase = createClient()
        const normalizedSearchQuery = searchQuery.trim()
        const normalizedPage = Math.max(1, page)
        const start = (normalizedPage - 1) * pageSize
        const end = start + pageSize - 1

        let query = supabase
          .from("user_exercises")
          .select("*", { count: "exact" })
          .eq("user_id", userId)

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
        const bodyRegionRowsByExerciseId = new Map<
          string,
          UserExerciseBodyRegion[]
        >()

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

          const {
            data: bodyRegionAssignments,
            error: bodyRegionAssignmentsError,
          } = await supabase
            .from("user_exercise_body_region_assignments")
            .select("exercise_id,body_region:user_exercise_body_regions(*)")
            .eq("user_id", userId)
            .in("exercise_id", exerciseIds)

          if (bodyRegionAssignmentsError) {
            return { error: getErrorMessage(bodyRegionAssignmentsError) }
          }

          for (const assignment of (bodyRegionAssignments ?? []) as {
            exercise_id: string
            body_region: UserExerciseBodyRegion | null
          }[]) {
            if (!assignment.body_region) {
              continue
            }

            const rows =
              bodyRegionRowsByExerciseId.get(assignment.exercise_id) ?? []
            rows.push(assignment.body_region)
            bodyRegionRowsByExerciseId.set(assignment.exercise_id, rows)
          }
        }

        return {
          data: {
            exercises: exerciseRows.map((exercise) => ({
              ...exercise,
              types: typeRowsByExerciseId.get(exercise.id) ?? [],
              body_regions: bodyRegionRowsByExerciseId.get(exercise.id) ?? [],
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
      UserExerciseBodyRegion[],
      { userId: string }
    >({
      async queryFn({ userId }) {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("user_exercise_body_regions")
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
      UserExerciseType | UserExerciseBodyRegion,
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
            : "user_exercise_body_regions"
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
      invalidatesTags: [listTag("Exercises"), listTag("ExerciseTaxonomy")],
    }),
    createExerciseTaxonomyItem: builder.mutation<
      UserExerciseType | UserExerciseBodyRegion,
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
            : "user_exercise_body_regions"
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
            : "user_exercise_body_regions"
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
            : "user_exercise_body_regions"
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

        return { data: { ...data, types: [], body_regions: [] } }
      },
      invalidatesTags: [listTag("Exercises"), listTag("ExerciseTaxonomy")],
    }),
    updateExercise: builder.mutation<
      null,
      { userId: string; exerciseId: string; payload: ExercisePayload }
    >({
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
      invalidatesTags: (_result, _error, { exerciseId }) => [
        listTag("Exercises"),
        listTag("ExerciseTaxonomy"),
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
      invalidatesTags: [listTag("Qualities")],
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
      invalidatesTags: (_result, _error, { qualityId }) => [
        listTag("Qualities"),
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

        if (exerciseIds.length > 0) {
          const { data: exerciseRows, error: exerciseError } = await supabase
            .from("user_exercises")
            .select("id,name,notes")
            .eq("user_id", userId)
            .in("id", exerciseIds)

          if (exerciseError) {
            return { error: getErrorMessage(exerciseError) }
          }

          for (const exercise of exerciseRows ?? []) {
            exerciseNamesById.set(exercise.id, exercise.name)
            exerciseNotesById.set(exercise.id, exercise.notes)
          }
        }

        return {
          data: rows.map((row) => ({
            ...row,
            exercise_name:
              exerciseNamesById.get(row.exercise_id) ?? "Unknown exercise",
            exercise_notes: exerciseNotesById.get(row.exercise_id) ?? null,
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
  useGetExercisesQuery,
  useGetExerciseTypesQuery,
  useGetExerciseBodyRegionsQuery,
  useUpdateExerciseTaxonomyItemMutation,
  useCreateExerciseTaxonomyItemMutation,
  useUpdateExerciseTaxonomySortKeyMutation,
  useDeleteExerciseTaxonomyItemMutation,
  useCreateExerciseMutation,
  useUpdateExerciseMutation,
  useDeleteExerciseMutation,
  useGetIssuesQuery,
  useCreateIssueMutation,
  useUpdateIssueMutation,
  useUpdateIssueSortKeyMutation,
  useGetQualitiesQuery,
  useCreateQualityMutation,
  useUpdateQualityMutation,
  useUpdateQualitySortKeyMutation,
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
  useGetConversationsQuery,
  useCreateConversationMutation,
  useTouchConversationMutation,
  useUpdateConversationMutation,
  useDeleteConversationMutation,
  useGetMessagesQuery,
  useCreateMessageMutation,
} = trainingApi
