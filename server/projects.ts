import { Hono } from "hono"
import { handleApiError } from "./api-errors.ts"
import { fail, isUuid, listProjects, query, readProject } from "./project-data.ts"
import { deleteObject, deletePrefix, putObject } from "./r2.ts"

const MAX_IMAGE_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
])

export type { ProjectRecord } from "./project-data.ts"

async function touchProjectUpdated(projectId: string) {
  await query("UPDATE projects SET updated_at = now() WHERE id = $1", [projectId])
}

function textField(value: unknown, label: string, max: number) {
  if (typeof value !== "string") fail(400, `${label} is required.`)
  const trimmed = value.trim()
  if (!trimmed) fail(400, `${label} is required.`)
  if (trimmed.length > max) fail(400, `${label} must be ${max} characters or fewer.`)
  return trimmed
}

function optionalText(value: unknown, label: string, max: number) {
  if (value === undefined) return undefined
  if (typeof value !== "string") fail(400, `${label} must be text.`)
  const trimmed = value.trim()
  if (trimmed.length > max) fail(400, `${label} must be ${max} characters or fewer.`)
  return trimmed
}

async function storeCover(projectId: string, file: File) {
  const extension = ALLOWED_TYPES.get(file.type)
  if (!extension) fail(400, "Use a JPEG, PNG, WebP, or GIF image.")
  if (file.size > MAX_IMAGE_BYTES) fail(400, "Each image must be 2 MB or smaller.")

  await readProject(projectId)

  const objectKey = `projects/${projectId}/cover.${extension}`
  const bytes = new Uint8Array(await file.arrayBuffer())
  await putObject(objectKey, bytes, file.type)

  const current = await query<{ cover_object_key: string | null }>(
    "SELECT cover_object_key FROM projects WHERE id = $1",
    [projectId],
  )
  const previousKey = current[0]?.cover_object_key
  if (previousKey && previousKey !== objectKey) {
    await deleteObject(previousKey).catch((error: unknown) => {
      console.error("Could not delete the previous cover from R2.", error)
    })
  }

  await query(
    "UPDATE projects SET cover_object_key = $2, cover_name = $3, updated_at = now() WHERE id = $1",
    [projectId, objectKey, file.name.slice(0, 180)],
  )
  return readProject(projectId)
}

async function storeGalleryImage(projectId: string, file: File) {
  const extension = ALLOWED_TYPES.get(file.type)
  if (!extension) fail(400, "Use a JPEG, PNG, WebP, or GIF image.")
  if (file.size > MAX_IMAGE_BYTES) fail(400, "Each image must be 2 MB or smaller.")

  await readProject(projectId)

  const imageId = crypto.randomUUID()
  const objectKey = `projects/${projectId}/gallery/${imageId}.${extension}`
  const bytes = new Uint8Array(await file.arrayBuffer())
  await putObject(objectKey, bytes, file.type)

  const positions = await query<{ next_position: number }>(
    "SELECT COALESCE(MAX(position), 0) + 1 AS next_position FROM project_images WHERE project_id = $1",
    [projectId],
  )
  await query(
    "INSERT INTO project_images (id, project_id, name, object_key, position) VALUES ($1, $2, $3, $4, $5)",
    [imageId, projectId, file.name.slice(0, 180), objectKey, positions[0]?.next_position ?? 1],
  )
  await touchProjectUpdated(projectId)
  return readProject(projectId)
}

async function storeContentImage(projectId: string, file: File) {
  const extension = ALLOWED_TYPES.get(file.type)
  if (!extension) fail(400, "Use a JPEG, PNG, WebP, or GIF image.")
  if (file.size > MAX_IMAGE_BYTES) fail(400, "Each image must be 2 MB or smaller.")

  await readProject(projectId)

  const imageId = crypto.randomUUID()
  const objectKey = `projects/${projectId}/content/${imageId}.${extension}`
  const bytes = new Uint8Array(await file.arrayBuffer())
  const src = await putObject(objectKey, bytes, file.type)
  await touchProjectUpdated(projectId)
  return { src }
}

async function fileFromBody(body: Record<string, unknown>) {
  const file = body.file
  if (!(file instanceof File)) fail(400, "Choose an image file.")
  return file
}

export const projects = new Hono()

projects.onError((error, c) => handleApiError(error, c))

projects.get("/", async (c) => {
  return c.json({ projects: await listProjects() })
})

projects.post("/", async (c) => {
  const body = await c.req.parseBody()
  const title = textField(body.title, "Project name", 120)
  const description = optionalText(body.description, "Description", 500) ?? ""
  const file = await fileFromBody(body)
  const id = crypto.randomUUID()
  await query(
    `INSERT INTO projects (id, title, description, content, position)
     VALUES ($1, $2, $3, '', (SELECT COALESCE(MAX(position), 0) + 1 FROM projects))`,
    [id, title, description],
  )
  return c.json(await storeCover(id, file), 201)
})

projects.patch("/:id", async (c) => {
  const id = c.req.param("id")
  const current = await readProject(id)
  const body = await c.req.json().catch(() => fail(400, "Send the project as JSON."))
  const title = body.title === undefined ? current.title : textField(body.title, "Project name", 120)
  const description =
    body.description === undefined ? current.description : (optionalText(body.description, "Description", 500) ?? "")
  const content = body.content === undefined ? current.content : optionalText(body.content, "Content", 200_000) ?? ""
  await query(
    "UPDATE projects SET title = $2, description = $3, content = $4, updated_at = now() WHERE id = $1",
    [id, title, description, content],
  )
  return c.json(await readProject(id))
})

projects.delete("/:id", async (c) => {
  const id = c.req.param("id")
  if (!isUuid(id)) fail(400, "That project id is not valid.")
  const rows = await query<{ id: string }>("SELECT id FROM projects WHERE id = $1", [id])
  if (!rows[0]) fail(404, "Project not found.")
  try {
    await deletePrefix(`projects/${id}/`)
  } catch (error: unknown) {
    console.error("Could not purge project files from R2.", error)
  }
  await query("DELETE FROM projects WHERE id = $1", [id])
  return c.json({ ok: true })
})

projects.post("/:id/cover", async (c) => {
  const id = c.req.param("id")
  const body = await c.req.parseBody()
  return c.json(await storeCover(id, await fileFromBody(body)), 201)
})

projects.post("/:id/images", async (c) => {
  const id = c.req.param("id")
  const body = await c.req.parseBody()
  await storeGalleryImage(id, await fileFromBody(body))
  return c.json(await readProject(id), 201)
})

projects.delete("/:id/images/:imageId", async (c) => {
  const id = c.req.param("id")
  const imageId = c.req.param("imageId")
  if (!isUuid(id) || !isUuid(imageId)) fail(400, "That image id is not valid.")
  const rows = await query<{ object_key: string }>(
    "DELETE FROM project_images WHERE id = $1 AND project_id = $2 RETURNING object_key",
    [imageId, id],
  )
  const objectKey = rows[0]?.object_key
  if (!objectKey) fail(404, "Image not found.")
  await deleteObject(objectKey).catch((error: unknown) => {
    console.error("Could not delete the image from R2.", error)
  })
  await touchProjectUpdated(id)
  return c.json(await readProject(id))
})

projects.post("/:id/content-images", async (c) => {
  const id = c.req.param("id")
  const body = await c.req.parseBody()
  const image = await storeContentImage(id, await fileFromBody(body))
  return c.json({ src: image.src }, 201)
})
