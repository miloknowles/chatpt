import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js"

export function asToolResult(data: unknown): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
    structuredContent: data as Record<string, unknown>,
  }
}
