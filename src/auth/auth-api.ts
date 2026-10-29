export type AuthUser = {
  id: string
  email: string
  role: "super_admin"
}

let unauthorizedHandler: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(path, { ...init, headers })
  const raw = await response.text()
  let payload: { error?: string } | T | null = null
  if (raw) {
    try {
      payload = JSON.parse(raw) as { error?: string } | T
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload && payload.error
        ? payload.error
        : raw && !raw.startsWith("<")
          ? raw
          : `Request failed (${response.status}${response.statusText ? ` ${response.statusText}` : ""}).`
    throw new Error(message)
  }

  return (payload ?? ({} as T)) as T
}

function parseUser(raw: unknown): AuthUser {
  if (!raw || typeof raw !== "object") {
    throw new Error("The session response was invalid.")
  }
  const record = raw as Record<string, unknown>
  if (record.role !== "super_admin") {
    throw new Error("The session response was invalid.")
  }
  return {
    id: String(record.id ?? ""),
    email: String(record.email ?? ""),
    role: "super_admin",
  }
}

export async function login(email: string, password: string) {
  const result = await authRequest<{ token: string; user: unknown }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
  return {
    token: result.token,
    user: parseUser(result.user),
  }
}

export async function logout(token: string) {
  await authRequest<{ ok: true }>("/api/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function fetchCurrentUser(token: string) {
  const result = await authRequest<{ user: unknown }>("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  })
  return parseUser(result.user)
}

export { unauthorizedHandler }
