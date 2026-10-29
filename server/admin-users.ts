import { databaseReady, pool } from "./db.ts"
import { hashPassword } from "./password.ts"

export const SUPER_ADMIN_EMAIL = "admin@civilmerc.com"
const SUPER_ADMIN_SEED_PASSWORD = "Password123$"

type AdminUserRow = {
  id: string
  email: string
  password_hash: string
  role: "super_admin"
}

export type AdminUser = {
  id: string
  email: string
  role: "super_admin"
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

async function query<T>(sql: string, params: unknown[] = []) {
  await databaseReady()
  if (!pool) {
    throw Object.assign(new Error("Set DATABASE_URL to connect Postgres."), { status: 503 })
  }
  const result = await pool.query(sql, params)
  return result.rows as T[]
}

export async function ensureSuperAdminSeed() {
  if (!pool) return

  const email = normalizeEmail(SUPER_ADMIN_EMAIL)
  const existing = await pool.query<{ id: string }>("SELECT id FROM admin_users WHERE email = $1", [email])
  if (existing.rows[0]) return

  const passwordHash = await hashPassword(SUPER_ADMIN_SEED_PASSWORD)
  await pool.query("INSERT INTO admin_users (id, email, password_hash, role) VALUES ($1, $2, $3, 'super_admin')", [
    crypto.randomUUID(),
    email,
    passwordHash,
  ])
}

export async function findAdminByEmail(email: string) {
  const rows = await query<AdminUserRow>("SELECT id, email, password_hash, role FROM admin_users WHERE email = $1", [
    normalizeEmail(email),
  ])
  return rows[0] ?? null
}

export async function findAdminById(id: string) {
  const rows = await query<AdminUserRow>("SELECT id, email, password_hash, role FROM admin_users WHERE id = $1", [id])
  return rows[0] ?? null
}

export function toPublicAdminUser(row: AdminUserRow): AdminUser {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
  }
}
