import { Hono } from "hono"
import { handleApiError } from "../api-errors.ts"
import { listProjectCacheTag, listProjectSummaries, readProject } from "../project-data.ts"

export const publicProjects = new Hono()

publicProjects.onError((error, c) => handleApiError(error, c))

function applyPublicCache(c: { header: (name: string, value: string) => void }, etag: string) {
  c.header("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
  c.header("ETag", `"${etag}"`)
}

publicProjects.get("/", async (c) => {
  const projects = await listProjectSummaries()
  applyPublicCache(c, listProjectCacheTag(projects))
  return c.json({ projects })
})

publicProjects.get("/:id", async (c) => {
  const id = c.req.param("id")
  const project = await readProject(id)
  applyPublicCache(c, `project-${project.id}-${project.updatedAt}`)
  return c.json({ project })
})
