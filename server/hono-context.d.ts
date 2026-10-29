import type { AuthTokenClaims } from "./jwt-auth.ts"

declare module "hono" {
  interface ContextVariableMap {
    auth: AuthTokenClaims
  }
}
