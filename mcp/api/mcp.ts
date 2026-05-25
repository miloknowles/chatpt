import { handleMcpHttpRequest } from "../src/http-handler.js"

export const config = {
  runtime: "nodejs",
}

export default {
  async fetch(request: Request): Promise<Response> {
    return handleMcpHttpRequest(request)
  },
}
