import { databaseReady, pool } from "./db.ts"

export const CONTACT_PAGE_ID = "contact"

type PageRow = {
  id: string
  title: string
  content: string
  status: "draft" | "published"
  updated_at: Date | string
}

export type ContactRecord = {
  id: "contact"
  title: string
  status: "draft" | "published"
  updatedAt: string
  address: string
  email: string
  phones: string[]
}

export type PublicContactPage = Omit<ContactRecord, "status">

type ContactPayload = {
  address: string
  email: string
  phones: string[]
}

export function fail(status: number, error: string): never {
  const failure = new Error(error) as Error & { status: number }
  failure.status = status
  throw failure
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

function parseContactContent(content: string): ContactPayload {
  try {
    const parsed = JSON.parse(content) as Partial<ContactPayload>
    return {
      address: typeof parsed.address === "string" ? parsed.address : "",
      email: typeof parsed.email === "string" ? parsed.email : "",
      phones: Array.isArray(parsed.phones)
        ? parsed.phones.filter((phone): phone is string => typeof phone === "string").map((phone) => phone.trim())
        : [],
    }
  } catch {
    return { address: "", email: "", phones: [] }
  }
}

export function serializeContact(payload: ContactPayload) {
  return JSON.stringify(payload)
}

function toContact(row: PageRow): ContactRecord {
  const details = parseContactContent(row.content)
  return {
    id: "contact",
    title: row.title,
    status: row.status,
    updatedAt: pageUpdatedAt(row.updated_at),
    address: details.address,
    email: details.email,
    phones: details.phones,
  }
}

function toPublicContactPage(contact: ContactRecord): PublicContactPage {
  const { status: _status, ...publicPage } = contact
  return publicPage
}

export async function readContactPage() {
  const rows = await query<PageRow>(
    "SELECT id, title, content, status, updated_at FROM cms_pages WHERE id = $1",
    [CONTACT_PAGE_ID],
  )
  const row = rows[0]
  if (!row) fail(404, "Contact page not found.")
  return toContact(row)
}

export async function readPublishedContactPage() {
  const rows = await query<PageRow>(
    "SELECT id, title, content, status, updated_at FROM cms_pages WHERE id = $1 AND status = 'published'",
    [CONTACT_PAGE_ID],
  )
  const row = rows[0]
  if (!row) fail(404, "Contact page not found.")
  return toPublicContactPage(toContact(row))
}

export function contactPageCacheTag(page: PublicContactPage) {
  return `contact-${page.updatedAt}`
}

export function optionalContactText(value: unknown, label: string, max: number) {
  if (value === undefined) return undefined
  if (typeof value !== "string") fail(400, `${label} must be text.`)
  const trimmed = value.trim()
  if (trimmed.length > max) fail(400, `${label} must be ${max} characters or fewer.`)
  return trimmed
}

export function parsePhones(value: unknown): string[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) fail(400, "Phone numbers must be a list.")
  const phones = value
    .map((item) => {
      if (typeof item !== "string") fail(400, "Each phone number must be text.")
      return item.trim()
    })
    .filter(Boolean)
  if (phones.length > 20) fail(400, "Add 20 phone numbers or fewer.")
  for (const phone of phones) {
    if (phone.length > 40) fail(400, "Each phone number must be 40 characters or fewer.")
  }
  return phones
}
