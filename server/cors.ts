import { cors } from "hono/cors"

const DEFAULT_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5190",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5190",
  "https://cms.civilmerc.com",
  "https://civilmerc.com",
  "https://www.civilmerc.com",
]

export function corsOrigins() {
  const raw = process.env.CORS_ORIGINS?.trim()
  if (!raw) return DEFAULT_ORIGINS
  return raw.split(",").map((entry) => entry.trim()).filter(Boolean)
}

export function apiCors() {
  const allowed = corsOrigins()
  return cors({
    origin: (origin) => {
      if (!origin) return allowed[0] ?? "https://cms.civilmerc.com"
      return allowed.includes(origin) ? origin : null
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "HEAD", "POST", "PATCH", "DELETE", "OPTIONS"],
    maxAge: 86_400,
  })
}
