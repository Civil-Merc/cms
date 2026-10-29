import { Hono } from "hono"
import {
  ABOUT_PAGE_ID,
  fail,
  isUuid,
  query,
  readAboutPage,
} from "./about-page-data.ts"
import { handleApiError } from "./api-errors.ts"
import { deleteObject, putObject } from "./r2.ts"

export { ABOUT_PAGE_ID } from "./about-page-data.ts"
export type { PageRecord } from "./about-page-data.ts"

const MAX_IMAGE_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
])

async function touchPageUpdated(pageId: string) {
  await query("UPDATE cms_pages SET updated_at = now() WHERE id = $1", [pageId])
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

async function storePageImage(file: File, folder: "gallery" | "content") {
  const extension = ALLOWED_TYPES.get(file.type)
  if (!extension) fail(400, "Use a JPEG, PNG, WebP, or GIF image.")
  if (file.size > MAX_IMAGE_BYTES) fail(400, "Each image must be 2 MB or smaller.")

  await readAboutPage()

  const imageId = crypto.randomUUID()
  const objectKey = `pages/${ABOUT_PAGE_ID}/${folder}/${imageId}.${extension}`
  const bytes = new Uint8Array(await file.arrayBuffer())
  const src = await putObject(objectKey, bytes, file.type)

  if (folder === "content") {
    return { id: imageId, name: file.name, src, objectKey }
  }

  const positions = await query<{ next_position: number }>(
    "SELECT COALESCE(MAX(position), 0) + 1 AS next_position FROM page_images WHERE page_id = $1",
    [ABOUT_PAGE_ID],
  )
  await query(
    "INSERT INTO page_images (id, page_id, name, object_key, position) VALUES ($1, $2, $3, $4, $5)",
    [imageId, ABOUT_PAGE_ID, file.name.slice(0, 180), objectKey, positions[0]?.next_position ?? 1],
  )
  await touchPageUpdated(ABOUT_PAGE_ID)
  return { id: imageId, name: file.name, src, objectKey }
}

async function fileFromBody(body: Record<string, unknown>) {
  const file = body.file
  if (!(file instanceof File)) fail(400, "Choose an image file.")
  return file
}

export const aboutPage = new Hono()

aboutPage.onError((error, c) => handleApiError(error, c))

aboutPage.get("/", async (c) => c.json(await readAboutPage()))

aboutPage.patch("/", async (c) => {
  const current = await readAboutPage()
  const body = await c.req.json().catch(() => fail(400, "Send the page as JSON."))
  const title = body.title === undefined ? current.title : textField(body.title, "Title", 120)
  const description =
    body.description === undefined ? current.description : (optionalText(body.description, "Description", 500) ?? "")
  const content = body.content === undefined ? current.content : (optionalText(body.content, "Content", 200_000) ?? "")
  let status = current.status
  if (body.status !== undefined) {
    if (body.status !== "draft" && body.status !== "published") fail(400, "Status must be draft or published.")
    status = body.status
  }
  await query(
    "UPDATE cms_pages SET title = $2, description = $3, content = $4, status = $5, updated_at = now() WHERE id = $1",
    [ABOUT_PAGE_ID, title, description, content, status],
  )
  return c.json(await readAboutPage())
})

aboutPage.post("/images", async (c) => {
  const body = await c.req.parseBody()
  await storePageImage(await fileFromBody(body), "gallery")
  return c.json(await readAboutPage(), 201)
})

aboutPage.delete("/images/:imageId", async (c) => {
  const imageId = c.req.param("imageId")
  if (!isUuid(imageId)) fail(400, "That image id is not valid.")
  const rows = await query<{ object_key: string }>(
    "DELETE FROM page_images WHERE id = $1 AND page_id = $2 RETURNING object_key",
    [imageId, ABOUT_PAGE_ID],
  )
  const objectKey = rows[0]?.object_key
  if (!objectKey) fail(404, "Image not found.")
  await deleteObject(objectKey).catch((error: unknown) => {
    console.error("Could not delete the image from R2.", error)
  })
  await touchPageUpdated(ABOUT_PAGE_ID)
  return c.json(await readAboutPage())
})

aboutPage.post("/content-images", async (c) => {
  const body = await c.req.parseBody()
  const image = await storePageImage(await fileFromBody(body), "content")
  return c.json({ src: image.src }, 201)
})
