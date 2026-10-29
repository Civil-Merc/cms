import { unauthorizedHandler } from "@/auth/auth-api"
import { clearAccessToken, getAccessToken } from "@/auth/auth-session"

export async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const token = getAccessToken()
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(path, { ...init, headers })
  const raw = await response.text()
  let payload: { error?: string; message?: string } | T | null = null
  if (raw) {
    try {
      payload = JSON.parse(raw) as { error?: string; message?: string } | T
    } catch {
      payload = null
    }
  }

  if (response.status === 401) {
    clearAccessToken()
    unauthorizedHandler?.()
  }

  if (!response.ok) {
    const jsonMessage =
      payload && typeof payload === "object"
        ? ("error" in payload && payload.error) ||
          ("message" in payload && payload.message) ||
          undefined
        : undefined
    const detail = jsonMessage || (raw && !raw.startsWith("<") ? raw : undefined)
    const hint =
      response.status === 404 && init?.method === "DELETE"
        ? " Restart the API (npm run dev) so the delete route is loaded."
        : ""
    throw new Error(
      detail ||
        `Request failed (${response.status}${response.statusText ? ` ${response.statusText}` : ""}).${hint}`,
    )
  }

  return (payload ?? ({} as T)) as T
}
