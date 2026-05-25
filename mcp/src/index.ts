import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { Readable } from "node:stream"

import { handleMcpHttpRequest } from "./http-handler.js"

function hasRequestBody(method: string | undefined): boolean {
  return method !== "GET" && method !== "HEAD"
}

function toWebRequest(req: IncomingMessage, port: number): Request {
  const host = req.headers.host ?? `localhost:${port}`
  const url = new URL(req.url ?? "/", `http://${host}`)
  const method = req.method ?? "GET"

  const init: RequestInit & { duplex?: "half" } = {
    method,
    headers: req.headers as HeadersInit,
  }

  if (hasRequestBody(method)) {
    init.body = Readable.toWeb(req) as ReadableStream
    init.duplex = "half"
  }

  return new Request(url, init)
}

async function writeWebResponse(
  response: Response,
  nodeRes: ServerResponse
): Promise<void> {
  nodeRes.statusCode = response.status
  nodeRes.statusMessage = response.statusText

  response.headers.forEach((value, key) => {
    nodeRes.setHeader(key, value)
  })

  if (!response.body) {
    nodeRes.end()
    return
  }

  const reader = response.body.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    nodeRes.write(Buffer.from(value))
  }
  nodeRes.end()
}

async function handleNodeRequest(
  req: IncomingMessage,
  res: ServerResponse,
  port: number
): Promise<void> {
  const pathname = new URL(req.url ?? "/", `http://${req.headers.host ?? `localhost:${port}`}`)
    .pathname

  if (pathname === "/health") {
    res.statusCode = 200
    res.setHeader("content-type", "application/json")
    res.end(JSON.stringify({ status: "ok" }))
    return
  }

  if (pathname !== "/mcp") {
    res.statusCode = 404
    res.setHeader("content-type", "application/json")
    res.end(JSON.stringify({ error: "Not found" }))
    return
  }

  const request = toWebRequest(req, port)
  const response = await handleMcpHttpRequest(request)
  await writeWebResponse(response, res)
}

async function main() {
  const port = Number(process.env.MCP_PORT ?? "3334")

  const server = createServer((req, res) => {
    void handleNodeRequest(req, res, port).catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Unexpected server error"
      res.statusCode = 500
      res.setHeader("content-type", "application/json")
      res.end(
        JSON.stringify({
          error: message,
        })
      )
    })
  })

  server.listen(port, () => {
    process.stdout.write(`MCP HTTP server listening on http://localhost:${port}/mcp\n`)
  })
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error)
  process.stderr.write(`${message}\n`)
  process.exit(1)
})
