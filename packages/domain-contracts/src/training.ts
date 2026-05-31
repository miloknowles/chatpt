import { z } from "zod"

export const UserQualityStatusSchema = z.enum([
  "building",
  "maintaining",
  "inactive",
])

export const WhoAmIInputSchema = z.object({})

export const UpdateUserMetadataInputSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
})

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const TimestampSchema = z.string().datetime({ offset: true })

export const ListUserSessionsInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  beforeDate: DateSchema.optional(),
})

export const CreateUserSessionInputSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.string().min(1).max(100),
  date: DateSchema.optional(),
  estimatedDurationMins: z.number().int().positive().max(1440).nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
})

export const ListUserExercisesInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
})

export const ListUserExerciseTaxonomyInputSchema = z.object({})

export const CreateUserExerciseInputSchema = z.object({
  name: z.string().min(1).max(200),
  notes: z.string().max(4000).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  videoUrl: z.string().url().nullable().optional(),
  exerciseTypeIds: z.array(z.string().uuid()).max(30).nullable().optional(),
  bodyRegionIds: z.array(z.string().uuid()).max(30).nullable().optional(),
  performance: z.record(z.unknown()).nullable().optional(),
})

export const UpdateUserExerciseInputSchema = z
  .object({
    exerciseId: z.string().uuid(),
    name: z.string().min(1).max(200).optional(),
    notes: z.string().max(4000).nullable().optional(),
    imageUrl: z.string().url().nullable().optional(),
    videoUrl: z.string().url().nullable().optional(),
    exerciseTypeIds: z.array(z.string().uuid()).max(30).nullable().optional(),
    bodyRegionIds: z.array(z.string().uuid()).max(30).nullable().optional(),
    performance: z.record(z.unknown()).nullable().optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.notes !== undefined ||
      value.imageUrl !== undefined ||
      value.videoUrl !== undefined ||
      value.exerciseTypeIds !== undefined ||
      value.bodyRegionIds !== undefined ||
      value.performance !== undefined,
    {
      message:
        "At least one editable field is required: name, notes, imageUrl, videoUrl, exerciseTypeIds, bodyRegionIds, or performance.",
    }
  )

export const DeleteUserExerciseInputSchema = z.object({
  exerciseId: z.string().uuid(),
})

export const LogUserExerciseInputSchema = z.object({
  sessionId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  sortKey: z.string().min(1).max(120),
  supersetId: z.string().uuid().nullable().optional(),
  completedAt: TimestampSchema.nullable().optional(),
  performance: z.record(z.unknown()).nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
})

export const UpdateUserQualityStatusInputSchema = z.object({
  qualityId: z.string().uuid(),
  status: UserQualityStatusSchema,
})

export const CreateUserNoteInputSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(20000),
})

export type ListUserSessionsInput = z.infer<typeof ListUserSessionsInputSchema>
export type CreateUserSessionInput = z.infer<typeof CreateUserSessionInputSchema>
export type ListUserExercisesInput = z.infer<typeof ListUserExercisesInputSchema>
export type ListUserExerciseTaxonomyInput = z.infer<
  typeof ListUserExerciseTaxonomyInputSchema
>
export type CreateUserExerciseInput = z.infer<typeof CreateUserExerciseInputSchema>
export type UpdateUserExerciseInput = z.infer<typeof UpdateUserExerciseInputSchema>
export type DeleteUserExerciseInput = z.infer<typeof DeleteUserExerciseInputSchema>
export type LogUserExerciseInput = z.infer<typeof LogUserExerciseInputSchema>
export type UpdateUserQualityStatusInput = z.infer<typeof UpdateUserQualityStatusInputSchema>
export type CreateUserNoteInput = z.infer<typeof CreateUserNoteInputSchema>
export type WhoAmIInput = z.infer<typeof WhoAmIInputSchema>
export type UpdateUserMetadataInput = z.infer<typeof UpdateUserMetadataInputSchema>
