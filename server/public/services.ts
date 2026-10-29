import { Hono } from "hono"
import { handleApiError } from "../api-errors.ts"
import { listCacheTag, listServiceSummaries, readService } from "../service-data.ts"

export const publicServices = new Hono()

publicServices.onError((error, c) => handleApiError(error, c))

function applyPublicCache(c: { header: (name: string, value: string) => void }, etag: string) {
  c.header("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
  c.header("ETag", `"${etag}"`)
}

publicServices.get("/", async (c) => {
  const services = await listServiceSummaries()
  applyPublicCache(c, listCacheTag(services))
  return c.json({ services })
})

publicServices.get("/:id", async (c) => {
  const id = c.req.param("id")
  const service = await readService(id)
  applyPublicCache(c, `service-${service.id}-${service.updatedAt}`)
  return c.json({ service })
})
