import type {
  CreateUserExerciseInput,
  DeleteUserExerciseInput,
  CreateUserNoteInput,
  CreateUserSessionInput,
  ListUserExerciseTaxonomyInput,
  ListUserExercisesInput,
  ListUserSessionsInput,
  LogUserExerciseInput,
  UpdateUserExerciseInput,
  UpdateUserMetadataInput,
  UpdateUserQualityStatusInput,
  WhoAmIInput,
} from "@chatpt/domain-contracts"

import { getAuthContext } from "../lib/supabase.js"

function uniqueIds(ids: string[] | null | undefined) {
  return Array.from(new Set(ids ?? []))
}

async function replaceAssignments({
  supabase,
  userId,
  exerciseId,
  table,
  idColumn,
  ids,
}: {
  supabase: Awaited<ReturnType<typeof getAuthContext>>["supabase"]
  userId: string
  exerciseId: string
  table:
    | "user_exercise_type_assignments"
    | "user_exercise_body_region_assignments"
  idColumn: "type_id" | "body_region_id"
  ids: string[] | null | undefined
}) {
  const { error: deleteError } = await supabase
    .from(table)
    .delete()
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  const assignmentIds = uniqueIds(ids)
  if (assignmentIds.length === 0) {
    return
  }

  const { error: insertError } = await supabase.from(table).insert(
    assignmentIds.map((id) => ({
      user_id: userId,
      exercise_id: exerciseId,
      [idColumn]: id,
    }))
  )

  if (insertError) {
    throw new Error(insertError.message)
  }
}

async function loadExerciseTaxonomy(
  supabase: Awaited<ReturnType<typeof getAuthContext>>["supabase"],
  userId: string,
  exerciseIds: string[]
) {
  const typeRowsByExerciseId = new Map<string, unknown[]>()
  const bodyRegionRowsByExerciseId = new Map<string, unknown[]>()

  if (exerciseIds.length === 0) {
    return { typeRowsByExerciseId, bodyRegionRowsByExerciseId }
  }

  const { data: typeAssignments, error: typeAssignmentsError } = await supabase
    .from("user_exercise_type_assignments")
    .select("exercise_id,type:user_exercise_types(*)")
    .eq("user_id", userId)
    .in("exercise_id", exerciseIds)

  if (typeAssignmentsError) {
    throw new Error(typeAssignmentsError.message)
  }

  for (const assignment of typeAssignments ?? []) {
    const exerciseId = assignment.exercise_id as string
    const type = assignment.type
    if (!type) {
      continue
    }

    const rows = typeRowsByExerciseId.get(exerciseId) ?? []
    rows.push(type)
    typeRowsByExerciseId.set(exerciseId, rows)
  }

  const { data: bodyRegionAssignments, error: bodyRegionAssignmentsError } =
    await supabase
      .from("user_exercise_body_region_assignments")
      .select("exercise_id,body_region:user_exercise_body_regions(*)")
      .eq("user_id", userId)
      .in("exercise_id", exerciseIds)

  if (bodyRegionAssignmentsError) {
    throw new Error(bodyRegionAssignmentsError.message)
  }

  for (const assignment of bodyRegionAssignments ?? []) {
    const exerciseId = assignment.exercise_id as string
    const bodyRegion = assignment.body_region
    if (!bodyRegion) {
      continue
    }

    const rows = bodyRegionRowsByExerciseId.get(exerciseId) ?? []
    rows.push(bodyRegion)
    bodyRegionRowsByExerciseId.set(exerciseId, rows)
  }

  return { typeRowsByExerciseId, bodyRegionRowsByExerciseId }
}

export async function whoAmI(_input: WhoAmIInput, accessToken: string) {
  const { supabase, userId } = await getAuthContext(accessToken)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken)

  if (error || !user) {
    throw new Error(error?.message ?? "Unauthorized. Unable to resolve user identity.")
  }

  const metadataName = user.user_metadata?.display_name

  return {
    user: {
      id: userId,
      email: user.email ?? null,
      displayName: typeof metadataName === "string" ? metadataName : null,
    },
  }
}

export async function updateUserMetadata(
  input: UpdateUserMetadataInput,
  accessToken: string
) {
  const { supabase, userId } = await getAuthContext(accessToken)

  const { data, error } = await supabase.auth.updateUser({
    data: { display_name: input.displayName },
  })

  if (error || !data.user) {
    throw new Error(error?.message ?? "Unable to update user metadata.")
  }

  const metadataName = data.user.user_metadata?.display_name

  return {
    user: {
      id: userId,
      email: data.user.email ?? null,
      displayName: typeof metadataName === "string" ? metadataName : null,
    },
  }
}

export async function listUserSessions(
  input: ListUserSessionsInput,
  accessToken: string
) {
  const { supabase, userId } = await getAuthContext(accessToken)

  let query = supabase
    .from("user_sessions")
    .select("id,name,type,date,estimated_duration_mins,notes,started_at,completed_at,created_at,updated_at")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(input.limit)

  if (input.beforeDate) {
    query = query.lt("date", input.beforeDate)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return {
    sessions: data ?? [],
    count: data?.length ?? 0,
  }
}

export async function createUserSession(
  input: CreateUserSessionInput,
  accessToken: string
) {
  const { supabase, userId } = await getAuthContext(accessToken)

  const { data, error } = await supabase
    .from("user_sessions")
    .insert({
      user_id: userId,
      name: input.name,
      type: input.type,
      date: input.date,
      estimated_duration_mins: input.estimatedDurationMins ?? null,
      notes: input.notes ?? null,
    })
    .select("id,name,type,date,estimated_duration_mins,notes,started_at,completed_at,created_at,updated_at")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return {
    session: data,
  }
}

export async function listUserExercises(
  input: ListUserExercisesInput,
  accessToken: string
) {
  const { supabase, userId } = await getAuthContext(accessToken)

  const { data, error } = await supabase
    .from("user_exercises")
    .select("id,name,notes,image_url,video_url,performance,created_at,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(input.limit)

  if (error) {
    throw new Error(error.message)
  }

  const exercises = data ?? []
  const { typeRowsByExerciseId, bodyRegionRowsByExerciseId } =
    await loadExerciseTaxonomy(
      supabase,
      userId,
      exercises.map((exercise) => exercise.id)
    )

  return {
    exercises: exercises.map((exercise) => ({
      ...exercise,
      types: typeRowsByExerciseId.get(exercise.id) ?? [],
      body_regions: bodyRegionRowsByExerciseId.get(exercise.id) ?? [],
    })),
    count: data?.length ?? 0,
  }
}

export async function listUserExerciseTaxonomy(
  _input: ListUserExerciseTaxonomyInput,
  accessToken: string
) {
  const { supabase, userId } = await getAuthContext(accessToken)

  const { data: types, error: typesError } = await supabase
    .from("user_exercise_types")
    .select("id,name,description,display_color,sort_key,is_system,created_at,updated_at")
    .eq("user_id", userId)
    .order("sort_key", { ascending: true })
    .order("name", { ascending: true })

  if (typesError) {
    throw new Error(typesError.message)
  }

  const { data: bodyRegions, error: bodyRegionsError } = await supabase
    .from("user_exercise_body_regions")
    .select("id,name,description,display_color,sort_key,is_system,created_at,updated_at")
    .eq("user_id", userId)
    .order("sort_key", { ascending: true })
    .order("name", { ascending: true })

  if (bodyRegionsError) {
    throw new Error(bodyRegionsError.message)
  }

  return {
    types: types ?? [],
    bodyRegions: bodyRegions ?? [],
  }
}

export async function createUserExercise(
  input: CreateUserExerciseInput,
  accessToken: string
) {
  const { supabase, userId } = await getAuthContext(accessToken)

  const { data, error } = await supabase
    .from("user_exercises")
    .insert({
      user_id: userId,
      name: input.name,
      notes: input.notes ?? null,
      image_url: input.imageUrl ?? null,
      video_url: input.videoUrl ?? null,
      performance: input.performance ?? null,
    })
    .select("id,name,notes,image_url,video_url,performance,created_at,updated_at")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  await replaceAssignments({
    supabase,
    userId,
    exerciseId: data.id,
    table: "user_exercise_type_assignments",
    idColumn: "type_id",
    ids: input.exerciseTypeIds,
  })
  await replaceAssignments({
    supabase,
    userId,
    exerciseId: data.id,
    table: "user_exercise_body_region_assignments",
    idColumn: "body_region_id",
    ids: input.bodyRegionIds,
  })

  return {
    exercise: {
      ...data,
      types: [],
      body_regions: [],
    },
  }
}

export async function updateUserExercise(
  input: UpdateUserExerciseInput,
  accessToken: string
) {
  const { supabase, userId } = await getAuthContext(accessToken)

  const updates: Record<string, unknown> = {}
  if (input.name !== undefined) updates.name = input.name
  if (input.notes !== undefined) updates.notes = input.notes
  if (input.imageUrl !== undefined) updates.image_url = input.imageUrl
  if (input.videoUrl !== undefined) updates.video_url = input.videoUrl
  if (input.performance !== undefined) updates.performance = input.performance

  const { data, error } = await supabase
    .from("user_exercises")
    .update(updates)
    .eq("user_id", userId)
    .eq("id", input.exerciseId)
    .select("id,name,notes,image_url,video_url,performance,created_at,updated_at")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  if (input.exerciseTypeIds !== undefined) {
    await replaceAssignments({
      supabase,
      userId,
      exerciseId: input.exerciseId,
      table: "user_exercise_type_assignments",
      idColumn: "type_id",
      ids: input.exerciseTypeIds,
    })
  }

  if (input.bodyRegionIds !== undefined) {
    await replaceAssignments({
      supabase,
      userId,
      exerciseId: input.exerciseId,
      table: "user_exercise_body_region_assignments",
      idColumn: "body_region_id",
      ids: input.bodyRegionIds,
    })
  }

  const { typeRowsByExerciseId, bodyRegionRowsByExerciseId } =
    await loadExerciseTaxonomy(supabase, userId, [input.exerciseId])

  return {
    exercise: {
      ...data,
      types: typeRowsByExerciseId.get(input.exerciseId) ?? [],
      body_regions: bodyRegionRowsByExerciseId.get(input.exerciseId) ?? [],
    },
  }
}

export async function deleteUserExercise(
  input: DeleteUserExerciseInput,
  accessToken: string
) {
  const { supabase, userId } = await getAuthContext(accessToken)

  const { data, error } = await supabase
    .from("user_exercises")
    .delete()
    .eq("user_id", userId)
    .eq("id", input.exerciseId)
    .select("id,name")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return {
    deleted: true,
    exercise: data,
  }
}

export async function logUserExercise(
  input: LogUserExerciseInput,
  accessToken: string
) {
  const { supabase, userId } = await getAuthContext(accessToken)

  const { data, error } = await supabase
    .from("user_logged_exercises")
    .insert({
      user_id: userId,
      session_id: input.sessionId,
      exercise_id: input.exerciseId,
      sort_key: input.sortKey,
      superset_id: input.supersetId ?? null,
      completed_at: input.completedAt ?? null,
      performance: input.performance ?? null,
      notes: input.notes ?? null,
    })
    .select("id,session_id,superset_id,exercise_id,sort_key,completed_at,performance,notes,created_at,updated_at")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return {
    loggedExercise: data,
  }
}

export async function updateUserQualityStatus(
  input: UpdateUserQualityStatusInput,
  accessToken: string
) {
  const { supabase, userId } = await getAuthContext(accessToken)

  const { data, error } = await supabase
    .from("user_qualities")
    .update({ status: input.status })
    .eq("user_id", userId)
    .eq("id", input.qualityId)
    .select("id,name,status,body_region,training_frequency_target,training_goal,updated_at")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return {
    quality: data,
  }
}

export async function createUserNote(
  input: CreateUserNoteInput,
  accessToken: string
) {
  const { supabase, userId } = await getAuthContext(accessToken)

  const { data, error } = await supabase
    .from("user_notes")
    .insert({
      user_id: userId,
      title: input.title,
      body: input.body,
    })
    .select("id,title,body,created_at,updated_at")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return {
    note: data,
  }
}
