import { SignJWT, jwtVerify } from "jose"

const ISSUER = "civilmerc-cms"
const AUDIENCE = "civilmerc-cms-admin"
const ACCESS_TOKEN_TTL = "12h"

export type AuthTokenClaims = {
  sub: string
  email: string
  role: "super_admin"
}

function jwtSecret() {
  const secret = process.env.JWT_SECRET?.trim()
  if (secret && secret.length >= 32) {
    return new TextEncoder().encode(secret)
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Set JWT_SECRET to at least 32 characters before running in production.")
  }
  return new TextEncoder().encode("civilmerc-cms-dev-secret-change-me-32chars")
}

export async function signAccessToken(claims: AuthTokenClaims) {
  return new SignJWT({ email: claims.email, role: claims.role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(jwtSecret())
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, jwtSecret(), {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: ["HS256"],
  })
  const sub = payload.sub
  const email = payload.email
  const role = payload.role
  if (typeof sub !== "string" || !sub) {
    throw new Error("Invalid token subject.")
  }
  if (typeof email !== "string" || !email) {
    throw new Error("Invalid token email.")
  }
  if (role !== "super_admin") {
    throw new Error("Invalid token role.")
  }
  return { sub, email, role } satisfies AuthTokenClaims
}
