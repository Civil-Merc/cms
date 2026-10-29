import { Hono } from "hono"
import { handleApiError } from "./api-errors.ts"
import { deleteObject, deletePrefix, putObject } from "./r2.ts"
import { fail, isUuid, listServices, query, readService } from "./service-data.ts"

const MAX_IMAGE_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
])

export type { ServiceRecord } from "./service-data.ts"

async function touchServiceUpdated(serviceId: string) {
  await query("UPDATE services SET updated_at = now() WHERE id = $1", [serviceId])
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

async function storeCover(serviceId: string, file: File) {
  const extension = ALLOWED_TYPES.get(file.type)
  if (!extension) fail(400, "Use a JPEG, PNG, WebP, or GIF image.")
  if (file.size > MAX_IMAGE_BYTES) fail(400, "Each image must be 2 MB or smaller.")

  await readService(serviceId)

  const objectKey = `services/${serviceId}/cover.${extension}`
  const bytes = new Uint8Array(await file.arrayBuffer())
  await putObject(objectKey, bytes, file.type)

  const current = await query<{ cover_object_key: string | null }>(
    "SELECT cover_object_key FROM services WHERE id = $1",
    [serviceId],
  )
  const previousKey = current[0]?.cover_object_key
  if (previousKey && previousKey !== objectKey) {
    await deleteObject(previousKey).catch((error: unknown) => {
      console.error("Could not delete the previous cover from R2.", error)
    })
  }

  await query(
    "UPDATE services SET cover_object_key = $2, cover_name = $3, updated_at = now() WHERE id = $1",
    [serviceId, objectKey, file.name.slice(0, 180)],
  )
  return readService(serviceId)
}

async function storeImage(serviceId: string, file: File, folder: "gallery" | "content") {
  const extension = ALLOWED_TYPES.get(file.type)
  if (!extension) fail(400, "Use a JPEG, PNG, WebP, or GIF image.")
  if (file.size > MAX_IMAGE_BYTES) fail(400, "Each image must be 2 MB or smaller.")

  await readService(serviceId)

  const imageId = crypto.randomUUID()
  const objectKey = `services/${serviceId}/${folder}/${imageId}.${extension}`
  const bytes = new Uint8Array(await file.arrayBuffer())
  const src = await putObject(objectKey, bytes, file.type)

  if (folder === "content") {
    return { id: imageId, name: file.name, src, objectKey }
  }

  const positions = await query<{ next_position: number }>(
    "SELECT COALESCE(MAX(position), 0) + 1 AS next_position FROM service_images WHERE service_id = $1",
    [serviceId],
  )
  await query(
    "INSERT INTO service_images (id, service_id, name, object_key, position) VALUES ($1, $2, $3, $4, $5)",
    [imageId, serviceId, file.name.slice(0, 180), objectKey, positions[0]?.next_position ?? 1],
  )
  await touchServiceUpdated(serviceId)
  return { id: imageId, name: file.name, src, objectKey }
}

async function fileFromBody(body: Record<string, unknown>) {
  const file = body.file
  if (!(file instanceof File)) fail(400, "Choose an image file.")
  return file
}

export const services = new Hono()

services.onError((error, c) => handleApiError(error, c))

services.get("/", async (c) => {
  const servicesList = await listServices()
  return c.json({ services: servicesList })
})

services.post("/", async (c) => {
  const body = await c.req.parseBody()
  const title = textField(body.title, "Service name", 120)
  const description = optionalText(body.description, "Description", 500) ?? ""
  const file = await fileFromBody(body)
  const id = crypto.randomUUID()
  await query(
    `INSERT INTO services (id, title, description, content, position)
     VALUES ($1, $2, $3, '', (SELECT COALESCE(MAX(position), 0) + 1 FROM services))`,
    [id, title, description],
  )
  return c.json(await storeCover(id, file), 201)
})

services.patch("/:id", async (c) => {
  const id = c.req.param("id")
  const current = await readService(id)
  const body = await c.req.json().catch(() => fail(400, "Send the service as JSON."))
  const title = body.title === undefined ? current.title : textField(body.title, "Service name", 120)
  const description = body.description === undefined ? current.description : (optionalText(body.description, "Description", 500) ?? "")
  const content = body.content === undefined ? current.content : optionalText(body.content, "Content", 200_000) ?? ""
  await query(
    "UPDATE services SET title = $2, description = $3, content = $4, updated_at = now() WHERE id = $1",
    [id, title, description, content],
  )
  return c.json(await readService(id))
})

services.delete("/:id", async (c) => {
  const id = c.req.param("id")
  if (!isUuid(id)) fail(400, "That service id is not valid.")
  const rows = await query<{ id: string }>("SELECT id FROM services WHERE id = $1", [id])
  if (!rows[0]) fail(404, "Service not found.")
  try {
    await deletePrefix(`services/${id}/`)
  } catch (error: unknown) {
    console.error("Could not purge service files from R2.", error)
  }
  await query("DELETE FROM services WHERE id = $1", [id])
  return c.json({ ok: true })
})

services.post("/:id/cover", async (c) => {
  const id = c.req.param("id")
  const body = await c.req.parseBody()
  return c.json(await storeCover(id, await fileFromBody(body)), 201)
})

services.post("/:id/images", async (c) => {
  const id = c.req.param("id")
  const body = await c.req.parseBody()
  await storeImage(id, await fileFromBody(body), "gallery")
  return c.json(await readService(id), 201)
})

services.delete("/:id/images/:imageId", async (c) => {
  const id = c.req.param("id")
  const imageId = c.req.param("imageId")
  if (!isUuid(id) || !isUuid(imageId)) fail(400, "That image id is not valid.")
  const rows = await query<{ object_key: string }>(
    "DELETE FROM service_images WHERE id = $1 AND service_id = $2 RETURNING object_key",
    [imageId, id],
  )
  const objectKey = rows[0]?.object_key
  if (!objectKey) fail(404, "Image not found.")
  await deleteObject(objectKey).catch((error: unknown) => {
    console.error("Could not delete the image from R2.", error)
  })
  await touchServiceUpdated(id)
  return c.json(await readService(id))
})

services.post("/:id/content-images", async (c) => {
  const id = c.req.param("id")
  const body = await c.req.parseBody()
  const image = await storeImage(id, await fileFromBody(body), "content")
  return c.json({ src: image.src }, 201)
})
