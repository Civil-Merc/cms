import type { MiddlewareHandler } from "hono"
import { verifyAccessToken } from "./jwt-auth.ts"

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const header = c.req.header("Authorization")
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Sign in to continue." }, 401)
  }

  const token = header.slice("Bearer ".length).trim()
  if (!token) {
    return c.json({ error: "Sign in to continue." }, 401)
  }

  try {
    const claims = await verifyAccessToken(token)
    c.set("auth", claims)
    await next()
  } catch {
    return c.json({ error: "Your session expired. Sign in again." }, 401)
  }
}
