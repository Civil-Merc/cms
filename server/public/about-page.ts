import { Hono } from "hono"
import { aboutPageCacheTag, readPublishedAboutPage } from "../about-page-data.ts"
import { handleApiError } from "../api-errors.ts"

export const publicAboutPage = new Hono()

publicAboutPage.onError((error, c) => handleApiError(error, c))

function applyPublicCache(c: { header: (name: string, value: string) => void }, etag: string) {
  c.header("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
  c.header("ETag", `"${etag}"`)
}

publicAboutPage.get("/", async (c) => {
  const page = await readPublishedAboutPage()
  applyPublicCache(c, aboutPageCacheTag(page))
  return c.json({ page })
})
