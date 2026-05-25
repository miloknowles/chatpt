export const config = {
  runtime: "nodejs",
}

export default {
  async fetch(): Promise<Response> {
    return Response.json({ status: "ok" })
  },
}
