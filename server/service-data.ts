import { databaseReady, pool } from "./db.ts"
import { publicUrl } from "./r2.ts"

type ServiceRow = {
  id: string
  title: string
  description: string
  content: string
  cover_object_key: string | null
  cover_name: string
  updated_at: Date | string
}

type ServiceSummaryRow = Pick<ServiceRow, "id" | "title" | "description" | "cover_object_key" | "cover_name" | "updated_at">

type ImageRow = {
  id: string
  service_id: string
  name: string
  object_key: string
  position: number
}

export type ServiceRecord = {
  id: string
  title: string
  description: string
  content: string
  updatedAt: string
  imageSrc: string
  imageName: string
  gallery: { id: string; name: string; src: string }[]
}

export type ServiceSummary = Pick<
  ServiceRecord,
  "id" | "title" | "description" | "updatedAt" | "imageSrc" | "imageName"
>

const LIST_ORDER = "ORDER BY position, created_at"

export function fail(status: number, error: string): never {
  const failure = new Error(error) as Error & { status: number }
  failure.status = status
  throw failure
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function serviceUpdatedAt(value: Date | string | null | undefined) {
  if (value == null) return new Date().toISOString()
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

export async function query<T>(sql: string, params: unknown[] = []) {
  await databaseReady()
  if (!pool) fail(503, "Set DATABASE_URL to connect Postgres.")
  const result = await pool.query(sql, params)
  return result.rows as T[]
}

function toService(row: ServiceRow, images: ImageRow[]): ServiceRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    content: row.content,
    updatedAt: serviceUpdatedAt(row.updated_at),
    imageSrc: row.cover_object_key ? publicUrl(row.cover_object_key) : "",
    imageName: row.cover_name || row.title,
    gallery: images
      .filter((image) => image.service_id === row.id)
      .sort((a, b) => a.position - b.position)
      .map((image) => ({
        id: image.id,
        name: image.name,
        src: publicUrl(image.object_key),
      })),
  }
}

function toServiceSummary(row: ServiceSummaryRow): ServiceSummary {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    updatedAt: serviceUpdatedAt(row.updated_at),
    imageSrc: row.cover_object_key ? publicUrl(row.cover_object_key) : "",
    imageName: row.cover_name || row.title,
  }
}

async function loadGalleryImages(serviceIds: string[]) {
  if (!serviceIds.length) return [] as ImageRow[]
  return query<ImageRow>(
    "SELECT id, service_id, name, object_key, position FROM service_images WHERE service_id = ANY($1::uuid[]) ORDER BY position",
    [serviceIds],
  )
}

export async function listServices() {
  const rows = await query<ServiceRow>(
    `SELECT id, title, description, content, cover_object_key, cover_name, updated_at FROM services ${LIST_ORDER}`,
  )
  const images = await loadGalleryImages(rows.map((row) => row.id))
  return rows.map((row) => toService(row, images))
}

export async function listServiceSummaries() {
  const rows = await query<ServiceSummaryRow>(
    `SELECT id, title, description, cover_object_key, cover_name, updated_at FROM services ${LIST_ORDER}`,
  )
  return rows.map(toServiceSummary)
}

export async function readService(id: string) {
  if (!isUuid(id)) fail(400, "That service id is not valid.")
  const rows = await query<ServiceRow>(
    "SELECT id, title, description, content, cover_object_key, cover_name, updated_at FROM services WHERE id = $1",
    [id],
  )
  const row = rows[0]
  if (!row) fail(404, "Service not found.")
  const images = await query<ImageRow>(
    "SELECT id, service_id, name, object_key, position FROM service_images WHERE service_id = $1 ORDER BY position",
    [id],
  )
  return toService(row, images)
}

export function listCacheTag(summaries: ServiceSummary[]) {
  if (!summaries.length) return "services-empty"
  let latest = summaries[0].updatedAt
  for (const item of summaries) {
    if (item.updatedAt > latest) latest = item.updatedAt
  }
  return `services-${latest}`
}
