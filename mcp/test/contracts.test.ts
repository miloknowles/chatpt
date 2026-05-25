import { describe, expect, it } from "vitest"

import {
  DeleteUserExerciseInputSchema,
  CreateUserSessionInputSchema,
  UpdateUserExerciseInputSchema,
  UpdateUserMetadataInputSchema,
  UpdateUserQualityStatusInputSchema,
  WhoAmIInputSchema,
} from "@chatpt/domain-contracts"

describe("domain contracts", () => {
  it("accepts a valid create session payload", () => {
    const parsed = CreateUserSessionInputSchema.parse({
      name: "Morning Strength",
      type: "strength",
      date: "2026-05-25",
      estimatedDurationMins: 45,
    })

    expect(parsed.name).toBe("Morning Strength")
    expect(parsed.estimatedDurationMins).toBe(45)
  })

  it("rejects invalid quality status", () => {
    expect(() =>
      UpdateUserQualityStatusInputSchema.parse({
        qualityId: "65539cd0-f403-4613-b7ac-c6f8104eec8d",
        status: "archived",
      })
    ).toThrow()
  })

  it("requires at least one editable field for exercise updates", () => {
    expect(() =>
      UpdateUserExerciseInputSchema.parse({
        exerciseId: "65539cd0-f403-4613-b7ac-c6f8104eec8d",
      })
    ).toThrow()
  })

  it("accepts a valid delete exercise payload", () => {
    const parsed = DeleteUserExerciseInputSchema.parse({
      exerciseId: "65539cd0-f403-4613-b7ac-c6f8104eec8d",
    })

    expect(parsed.exerciseId).toBe("65539cd0-f403-4613-b7ac-c6f8104eec8d")
  })

  it("accepts an empty auth_info payload", () => {
    const parsed = WhoAmIInputSchema.parse({})
    expect(parsed).toEqual({})
  })

  it("normalizes a valid user metadata update payload", () => {
    const parsed = UpdateUserMetadataInputSchema.parse({
      displayName: "  Milo  ",
    })

    expect(parsed.displayName).toBe("Milo")
  })
})
