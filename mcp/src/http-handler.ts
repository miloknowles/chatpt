import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"

import { createTrainingMcpServer } from "./server.js"

function withCors(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set("access-control-allow-origin", "*")
  headers.set("access-control-allow-methods", "GET, POST, DELETE, OPTIONS")
  headers.set(
    "access-control-allow-headers",
    "content-type, authorization, mcp-protocol-version, mcp-session-id, last-event-id"
  )
  headers.set(
    "access-control-expose-headers",
    "mcp-protocol-version, mcp-session-id"
  )

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export async function handleMcpHttpRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }))
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  const server = createTrainingMcpServer()

  await server.connect(transport)

  try {
    const response = await transport.handleRequest(request)
    return withCors(response)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error"

    return withCors(
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message,
          },
          id: null,
        }),
        {
          status: 500,
          headers: {
            "content-type": "application/json",
          },
        }
      )
    )
  } finally {
    await transport.close().catch(() => undefined)
    await server.close().catch(() => undefined)
  }
}
