import type {
  CreateUserExerciseInput,
  DeleteUserExerciseInput,
  CreateUserNoteInput,
  CreateUserSessionInput,
  ListUserExerciseTagsInput,
  ListUserExercisesInput,
  ListUserSessionsInput,
  LogUserExerciseInput,
  UpdateUserExerciseInput,
  UpdateUserMetadataInput,
  UpdateUserQualityStatusInput,
  WhoAmIInput,
} from "@chatpt/domain-contracts"

import { getAuthContext } from "../lib/supabase.js"

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
    .select("id,name,notes,image_url,video_url,tags,performance,created_at,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(input.limit)

  if (error) {
    throw new Error(error.message)
  }

  return {
    exercises: data ?? [],
    count: data?.length ?? 0,
  }
}

export async function listUserExerciseTags(
  _input: ListUserExerciseTagsInput,
  accessToken: string
) {
  const { supabase, userId } = await getAuthContext(accessToken)

  const { data, error } = await supabase
    .from("user_exercises")
    .select("tags")
    .eq("user_id", userId)

  if (error) {
    throw new Error(error.message)
  }

  const tags = Array.from(
    new Set(
      (data ?? [])
        .flatMap((exercise) => exercise.tags ?? [])
        .filter((tag): tag is string => typeof tag === "string" && tag.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b))

  return {
    tags,
    count: tags.length,
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
      tags: input.tags ?? null,
      performance: input.performance ?? null,
    })
    .select("id,name,notes,image_url,video_url,tags,performance,created_at,updated_at")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return {
    exercise: data,
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
  if (input.tags !== undefined) updates.tags = input.tags
  if (input.performance !== undefined) updates.performance = input.performance

  const { data, error } = await supabase
    .from("user_exercises")
    .update(updates)
    .eq("user_id", userId)
    .eq("id", input.exerciseId)
    .select("id,name,notes,image_url,video_url,tags,performance,created_at,updated_at")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return {
    exercise: data,
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
