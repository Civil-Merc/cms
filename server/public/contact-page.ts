import { Hono } from "hono"
import { contactPageCacheTag, readPublishedContactPage } from "../contact-page-data.ts"
import { handleApiError } from "../api-errors.ts"

export const publicContactPage = new Hono()

publicContactPage.onError((error, c) => handleApiError(error, c))

function applyPublicCache(c: { header: (name: string, value: string) => void }, etag: string) {
  c.header("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
  c.header("ETag", `"${etag}"`)
}

publicContactPage.get("/", async (c) => {
  const page = await readPublishedContactPage()
  applyPublicCache(c, contactPageCacheTag(page))
  return c.json({ page })
})
