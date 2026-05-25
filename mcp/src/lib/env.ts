import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

export interface McpEnv {
  supabaseUrl: string
  supabasePublishableKey: string
}

let didLoadLocalEnv = false

function stripMatchingQuotes(value: string): string {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) {
    return
  }

  const contents = readFileSync(filePath, "utf8")

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) {
      continue
    }

    const separatorIndex = trimmed.indexOf("=")
    if (separatorIndex === -1) {
      continue
    }

    const rawKey = trimmed.slice(0, separatorIndex).trim()
    if (!rawKey || process.env[rawKey] !== undefined) {
      continue
    }

    const rawValue = trimmed.slice(separatorIndex + 1).trim()
    process.env[rawKey] = stripMatchingQuotes(rawValue)
  }
}

function ensureLocalEnvLoaded() {
  if (didLoadLocalEnv) {
    return
  }
  didLoadLocalEnv = true

  const currentFilePath = fileURLToPath(import.meta.url)
  const mcpRoot = path.resolve(path.dirname(currentFilePath), "../..")

  // Load local overrides first so they win over `.env`.
  loadEnvFile(path.join(mcpRoot, ".env.local"))
  loadEnvFile(path.join(mcpRoot, ".env"))
}

export function getEnv(): McpEnv {
  ensureLocalEnvLoaded()

  const supabaseUrl = process.env.MCP_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabasePublishableKey =
    process.env.MCP_SUPABASE_PUBLISHABLE_KEY ??
    process.env.MCP_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error("Missing MCP_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)")
  }

  if (!supabasePublishableKey) {
    throw new Error(
      "Missing MCP_SUPABASE_PUBLISHABLE_KEY/MCP_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY)"
    )
  }

  return {
    supabaseUrl,
    supabasePublishableKey,
  }
}
