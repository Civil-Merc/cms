import { databaseReady, pool } from "./db.ts"
import { publicUrl } from "./r2.ts"

type ProjectRow = {
  id: string
  title: string
  description: string
  content: string
  cover_object_key: string | null
  cover_name: string
  updated_at: Date | string
}

type ProjectSummaryRow = Pick<ProjectRow, "id" | "title" | "description" | "cover_object_key" | "cover_name" | "updated_at">

type ImageRow = {
  id: string
  project_id: string
  name: string
  object_key: string
  position: number
}

export type ProjectRecord = {
  id: string
  title: string
  description: string
  content: string
  updatedAt: string
  imageSrc: string
  imageName: string
  gallery: { id: string; name: string; src: string }[]
}

export type ProjectSummary = Pick<
  ProjectRecord,
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

function projectUpdatedAt(value: Date | string | null | undefined) {
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

function toProject(row: ProjectRow, images: ImageRow[]): ProjectRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    content: row.content,
    updatedAt: projectUpdatedAt(row.updated_at),
    imageSrc: row.cover_object_key ? publicUrl(row.cover_object_key) : "",
    imageName: row.cover_name || row.title,
    gallery: images
      .filter((image) => image.project_id === row.id)
      .sort((a, b) => a.position - b.position)
      .map((image) => ({
        id: image.id,
        name: image.name,
        src: publicUrl(image.object_key),
      })),
  }
}

function toProjectSummary(row: ProjectSummaryRow): ProjectSummary {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    updatedAt: projectUpdatedAt(row.updated_at),
    imageSrc: row.cover_object_key ? publicUrl(row.cover_object_key) : "",
    imageName: row.cover_name || row.title,
  }
}

async function loadGalleryImages(projectIds: string[]) {
  if (!projectIds.length) return [] as ImageRow[]
  return query<ImageRow>(
    "SELECT id, project_id, name, object_key, position FROM project_images WHERE project_id = ANY($1::uuid[]) ORDER BY position",
    [projectIds],
  )
}

export async function listProjects() {
  const rows = await query<ProjectRow>(
    `SELECT id, title, description, content, cover_object_key, cover_name, updated_at FROM projects ${LIST_ORDER}`,
  )
  const images = await loadGalleryImages(rows.map((row) => row.id))
  return rows.map((row) => toProject(row, images))
}

export async function listProjectSummaries() {
  const rows = await query<ProjectSummaryRow>(
    `SELECT id, title, description, cover_object_key, cover_name, updated_at FROM projects ${LIST_ORDER}`,
  )
  return rows.map(toProjectSummary)
}

export async function readProject(id: string) {
  if (!isUuid(id)) fail(400, "That project id is not valid.")
  const rows = await query<ProjectRow>(
    "SELECT id, title, description, content, cover_object_key, cover_name, updated_at FROM projects WHERE id = $1",
    [id],
  )
  const row = rows[0]
  if (!row) fail(404, "Project not found.")
  const images = await query<ImageRow>(
    "SELECT id, project_id, name, object_key, position FROM project_images WHERE project_id = $1 ORDER BY position",
    [id],
  )
  return toProject(row, images)
}

export function listProjectCacheTag(summaries: ProjectSummary[]) {
  if (!summaries.length) return "projects-empty"
  let latest = summaries[0].updatedAt
  for (const item of summaries) {
    if (item.updatedAt > latest) latest = item.updatedAt
  }
  return `projects-${latest}`
}
