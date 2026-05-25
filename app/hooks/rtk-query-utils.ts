import type { SerializedError } from "@reduxjs/toolkit"

export type HookActionResult<T extends object = object> = Promise<
  { error?: string } & Partial<T>
>

export function getRtkErrorMessage(
  error: string | SerializedError | undefined
) {
  if (!error) {
    return null
  }

  if (typeof error === "string") {
    return error
  }

  return error.message ?? "Unexpected error."
}

export function getThrownErrorMessage(error: unknown) {
  if (!error) {
    return "Unexpected error."
  }

  if (typeof error === "string") {
    return error
  }

  if (typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message

    if (typeof message === "string") {
      return message
    }
  }

  return "Unexpected error."
}
