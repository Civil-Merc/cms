import type { Context } from "hono"
import type { ContentfulStatusCode } from "hono/utils/http-status"

export function handleApiError(error: unknown, c: Context) {
  const message = error instanceof Error ? error.message : "Could not complete the request."
  const connectionFailed = /ECONNREFUSED|ENOTFOUND|password authentication|does not exist|timeout/i.test(message)
  const status =
    error instanceof Error && "status" in error && typeof error.status === "number"
      ? error.status
      : connectionFailed
        ? 503
        : 500
  const body = status === 500 ? "Could not complete the request." : message
  if (status === 500) console.error(error)
  return c.json({ error: body }, status as ContentfulStatusCode)
}
