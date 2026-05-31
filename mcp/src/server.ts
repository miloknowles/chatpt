import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import {
  CreateUserExerciseInputSchema,
  DeleteUserExerciseInputSchema,
  CreateUserNoteInputSchema,
  CreateUserSessionInputSchema,
  ListUserExerciseTagsInputSchema,
  ListUserExercisesInputSchema,
  ListUserSessionsInputSchema,
  LogUserExerciseInputSchema,
  UpdateUserMetadataInputSchema,
  UpdateUserExerciseInputSchema,
  UpdateUserQualityStatusInputSchema,
  WhoAmIInputSchema,
} from "@chatpt/domain-contracts"

import {
  createUserExercise,
  deleteUserExercise,
  createUserNote,
  createUserSession,
  listUserExerciseTags,
  listUserExercises,
  listUserSessions,
  logUserExercise,
  updateUserMetadata,
  whoAmI,
  updateUserExercise,
  updateUserQualityStatus,
} from "./actions/training.js"
import { asToolResult } from "./lib/results.js"

function getHeaderValue(
  headers: Headers | Record<string, unknown> | undefined,
  name: string
): string | null {
  if (!headers) {
    return null
  }

  if (headers instanceof Headers) {
    return headers.get(name)
  }

  const headerValue = headers[name] ?? headers[name.toLowerCase()]
  if (Array.isArray(headerValue)) {
    return String(headerValue[0] ?? "")
  }
  if (typeof headerValue === "string") {
    return headerValue
  }

  return null
}

function getAccessTokenFromExtra(extra: unknown): string {
  const requestInfo = (extra as { requestInfo?: { headers?: Headers | Record<string, unknown> } })
    ?.requestInfo
  const authorizationHeader = getHeaderValue(requestInfo?.headers, "authorization")

  if (!authorizationHeader) {
    throw new Error("Unauthorized. Missing Authorization header.")
  }

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i)
  if (!match?.[1]) {
    throw new Error("Unauthorized. Expected Authorization: Bearer <token>.")
  }

  return match[1].trim()
}

export function createTrainingMcpServer() {
  const server = new McpServer(
    {
      name: "chatpt-training",
      version: "0.1.0",
    },
    {
      instructions:
        "Use these tools for authenticated training data CRUD. Authentication is taken from the bearer Authorization header on the MCP request. For writes, only submit user-confirmed values.",
    }
  )

  server.registerTool(
    "auth_info",
    {
      title: "Auth Info",
      description:
        "Return the authenticated user's identity details derived from the bearer token.",
      inputSchema: WhoAmIInputSchema,
    },
    async (args: unknown, extra: unknown) => {
      const input = WhoAmIInputSchema.parse(args)
      const accessToken = getAccessTokenFromExtra(extra)
      return asToolResult(await whoAmI(input, accessToken))
    }
  )

  server.registerTool(
    "update_user_metadata",
    {
      title: "Update User Metadata",
      description:
        "Update metadata for the authenticated user. Currently supports displayName.",
      inputSchema: UpdateUserMetadataInputSchema,
    },
    async (args: unknown, extra: unknown) => {
      const input = UpdateUserMetadataInputSchema.parse(args)
      const accessToken = getAccessTokenFromExtra(extra)
      return asToolResult(await updateUserMetadata(input, accessToken))
    }
  )

  server.registerTool(
    "list_user_sessions",
    {
      title: "List User Sessions",
      description: "List recent user sessions in reverse chronological order.",
      inputSchema: ListUserSessionsInputSchema,
    },
    async (args: unknown, extra: unknown) => {
      const input = ListUserSessionsInputSchema.parse(args)
      const accessToken = getAccessTokenFromExtra(extra)
      return asToolResult(await listUserSessions(input, accessToken))
    }
  )

  server.registerTool(
    "create_user_session",
    {
      title: "Create User Session",
      description: "Create a training session for the authenticated user.",
      inputSchema: CreateUserSessionInputSchema,
    },
    async (args: unknown, extra: unknown) => {
      const input = CreateUserSessionInputSchema.parse(args)
      const accessToken = getAccessTokenFromExtra(extra)
      return asToolResult(await createUserSession(input, accessToken))
    }
  )

  server.registerTool(
    "list_user_exercises",
    {
      title: "List User Exercises",
      description: "List recent user exercise library items.",
      inputSchema: ListUserExercisesInputSchema,
    },
    async (args: unknown, extra: unknown) => {
      const input = ListUserExercisesInputSchema.parse(args)
      const accessToken = getAccessTokenFromExtra(extra)
      return asToolResult(await listUserExercises(input, accessToken))
    }
  )

  server.registerTool(
    "list_user_exercise_tags",
    {
      title: "List User Exercise Tags",
      description:
        "List all unique tags currently used by the authenticated user's exercise library.",
      inputSchema: ListUserExerciseTagsInputSchema,
    },
    async (args: unknown, extra: unknown) => {
      const input = ListUserExerciseTagsInputSchema.parse(args)
      const accessToken = getAccessTokenFromExtra(extra)
      return asToolResult(await listUserExerciseTags(input, accessToken))
    }
  )

  server.registerTool(
    "create_user_exercise",
    {
      title: "Create User Exercise",
      description: "Create an exercise in the authenticated user's exercise library.",
      inputSchema: CreateUserExerciseInputSchema,
    },
    async (args: unknown, extra: unknown) => {
      const input = CreateUserExerciseInputSchema.parse(args)
      const accessToken = getAccessTokenFromExtra(extra)
      return asToolResult(await createUserExercise(input, accessToken))
    }
  )

  server.registerTool(
    "update_user_exercise",
    {
      title: "Update User Exercise",
      description:
        "Update an exercise in the authenticated user's exercise library.",
      inputSchema: UpdateUserExerciseInputSchema,
    },
    async (args: unknown, extra: unknown) => {
      const input = UpdateUserExerciseInputSchema.parse(args)
      const accessToken = getAccessTokenFromExtra(extra)
      return asToolResult(await updateUserExercise(input, accessToken))
    }
  )

  server.registerTool(
    "delete_user_exercise",
    {
      title: "Delete User Exercise",
      description:
        "Delete an exercise from the authenticated user's exercise library.",
      inputSchema: DeleteUserExerciseInputSchema,
    },
    async (args: unknown, extra: unknown) => {
      const input = DeleteUserExerciseInputSchema.parse(args)
      const accessToken = getAccessTokenFromExtra(extra)
      return asToolResult(await deleteUserExercise(input, accessToken))
    }
  )

  server.registerTool(
    "log_user_exercise",
    {
      title: "Log User Exercise",
      description: "Add a logged exercise entry to a user session.",
      inputSchema: LogUserExerciseInputSchema,
    },
    async (args: unknown, extra: unknown) => {
      const input = LogUserExerciseInputSchema.parse(args)
      const accessToken = getAccessTokenFromExtra(extra)
      return asToolResult(await logUserExercise(input, accessToken))
    }
  )

  server.registerTool(
    "update_user_quality_status",
    {
      title: "Update User Quality Status",
      description: "Update quality status (building, maintaining, inactive).",
      inputSchema: UpdateUserQualityStatusInputSchema,
    },
    async (args: unknown, extra: unknown) => {
      const input = UpdateUserQualityStatusInputSchema.parse(args)
      const accessToken = getAccessTokenFromExtra(extra)
      return asToolResult(await updateUserQualityStatus(input, accessToken))
    }
  )

  server.registerTool(
    "create_user_note",
    {
      title: "Create User Note",
      description: "Create a timestamped user note.",
      inputSchema: CreateUserNoteInputSchema,
    },
    async (args: unknown, extra: unknown) => {
      const input = CreateUserNoteInputSchema.parse(args)
      const accessToken = getAccessTokenFromExtra(extra)
      return asToolResult(await createUserNote(input, accessToken))
    }
  )

  return server
}
