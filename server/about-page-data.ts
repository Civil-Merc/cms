import { databaseReady, pool } from "./db.ts"
import { publicUrl } from "./r2.ts"

export const ABOUT_PAGE_ID = "about"

type PageRow = {
  id: string
  title: string
  description: string
  content: string
  status: "draft" | "published"
  updated_at: Date | string
}

type PageImageRow = {
  id: string
  page_id: string
  name: string
  object_key: string
  position: number
}

export type PageRecord = {
  id: string
  title: string
  description: string
  content: string
  status: "draft" | "published"
  updatedAt: string
  gallery: { id: string; name: string; src: string }[]
}

export type PublicAboutPage = Omit<PageRecord, "status">

export function fail(status: number, error: string): never {
  const failure = new Error(error) as Error & { status: number }
  failure.status = status
  throw failure
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function pageUpdatedAt(value: Date | string | null | undefined) {
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

function toPage(row: PageRow, images: PageImageRow[]): PageRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    content: row.content,
    status: row.status,
    updatedAt: pageUpdatedAt(row.updated_at),
    gallery: images
      .filter((image) => image.page_id === row.id)
      .sort((a, b) => a.position - b.position)
      .map((image) => ({
        id: image.id,
        name: image.name,
        src: publicUrl(image.object_key),
      })),
  }
}

function toPublicAboutPage(page: PageRecord): PublicAboutPage {
  const { status: _status, ...publicPage } = page
  return publicPage
}

async function loadAboutImages() {
  return query<PageImageRow>(
    "SELECT id, page_id, name, object_key, position FROM page_images WHERE page_id = $1 ORDER BY position",
    [ABOUT_PAGE_ID],
  )
}

export async function readAboutPage() {
  const rows = await query<PageRow>(
    "SELECT id, title, description, content, status, updated_at FROM cms_pages WHERE id = $1",
    [ABOUT_PAGE_ID],
  )
  const row = rows[0]
  if (!row) fail(404, "About page not found.")
  return toPage(row, await loadAboutImages())
}

export async function readPublishedAboutPage() {
  const rows = await query<PageRow>(
    "SELECT id, title, description, content, status, updated_at FROM cms_pages WHERE id = $1 AND status = 'published'",
    [ABOUT_PAGE_ID],
  )
  const row = rows[0]
  if (!row) fail(404, "About page not found.")
  return toPublicAboutPage(toPage(row, await loadAboutImages()))
}

export function aboutPageCacheTag(page: PublicAboutPage) {
  return `about-${page.updatedAt}`
}
