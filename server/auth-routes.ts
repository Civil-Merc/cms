import { Hono } from "hono"
import { findAdminByEmail, findAdminById, toPublicAdminUser } from "./admin-users.ts"
import { handleApiError } from "./api-errors.ts"
import { signAccessToken } from "./jwt-auth.ts"
import { verifyPassword } from "./password.ts"
import { requireAuth } from "./require-auth.ts"

function fail(status: number, error: string): never {
  const failure = new Error(error) as Error & { status: number }
  failure.status = status
  throw failure
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") fail(400, "Email is required.")
  const email = value.trim().toLowerCase()
  if (!email) fail(400, "Email is required.")
  if (email.length > 180) fail(400, "Email must be 180 characters or fewer.")
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, "Enter a valid email address.")
  return email
}

function readPassword(value: unknown) {
  if (typeof value !== "string" || !value) fail(400, "Password is required.")
  if (value.length > 200) fail(400, "Password must be 200 characters or fewer.")
  return value
}

export const authRoutes = new Hono()

authRoutes.onError((error, c) => handleApiError(error, c))

authRoutes.post("/login", async (c) => {
  const body = await c.req.json().catch(() => fail(400, "Send email and password as JSON."))
  const email = normalizeEmail(body.email)
  const password = readPassword(body.password)

  const user = await findAdminByEmail(email)
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    fail(401, "Incorrect email or password.")
  }

  const token = await signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  })

  return c.json({
    token,
    user: toPublicAdminUser(user),
  })
})

authRoutes.post("/logout", requireAuth, (c) => c.json({ ok: true }))

authRoutes.get("/me", requireAuth, async (c) => {
  const claims = c.get("auth")
  const user = await findAdminById(claims.sub)
  if (!user) fail(401, "Your session expired. Sign in again.")
  return c.json({ user: toPublicAdminUser(user) })
})
