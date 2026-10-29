import type { ProjectItem } from "@/auth/admin/cms-pages"
import type { GalleryImage } from "@/auth/admin/ImageGallery"
import { adminRequest as request } from "@/auth/admin/admin-fetch"

function parseUpdatedAt(raw: Record<string, unknown>) {
  const value = raw.updatedAt ?? raw.updated_at
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "string" && value.trim()) return value
  if (typeof value === "number") {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) return date.toISOString()
  }
  return ""
}

export function parseProject(raw: unknown): ProjectItem {
  if (!raw || typeof raw !== "object") {
    throw new Error("The project response was invalid.")
  }
  const record = raw as Record<string, unknown>
  const gallery = Array.isArray(record.gallery) ? (record.gallery as GalleryImage[]) : []

  return {
    id: String(record.id ?? ""),
    title: String(record.title ?? ""),
    description: String(record.description ?? ""),
    content: String(record.content ?? ""),
    updatedAt: parseUpdatedAt(record),
    imageSrc: String(record.imageSrc ?? ""),
    imageName: String(record.imageName ?? ""),
    gallery,
  }
}

export async function listProjects() {
  const result = await request<{ projects: unknown[] }>("/api/projects")
  return { projects: result.projects.map(parseProject) }
}

export async function createProject(input: { title: string; description: string; file: File }) {
  const body = new FormData()
  body.set("title", input.title)
  body.set("description", input.description)
  body.set("file", input.file)
  return parseProject(
    await request<unknown>("/api/projects", {
      method: "POST",
      body,
    }),
  )
}

export async function updateProject(
  id: string,
  patch: Partial<Pick<ProjectItem, "title" | "description" | "content">>,
  signal?: AbortSignal,
) {
  return parseProject(
    await request<unknown>(`/api/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
      signal,
    }),
  )
}

export async function uploadProjectCover(projectId: string, file: File) {
  const body = new FormData()
  body.set("file", file)
  return parseProject(
    await request<unknown>(`/api/projects/${projectId}/cover`, {
      method: "POST",
      body,
    }),
  )
}

export async function uploadProjectImage(projectId: string, file: File) {
  const body = new FormData()
  body.set("file", file)
  const project = parseProject(
    await request<unknown>(`/api/projects/${projectId}/images`, {
      method: "POST",
      body,
    }),
  )
  const image = project.gallery.at(-1)
  if (!image) throw new Error("The image was not saved.")
  return image
}

export async function deleteProjectImage(projectId: string, imageId: string) {
  return parseProject(
    await request<unknown>(`/api/projects/${projectId}/images/${imageId}`, {
      method: "DELETE",
    }),
  )
}

export function deleteProject(id: string, signal?: AbortSignal) {
  return request<{ ok: true }>(`/api/projects/${id}`, {
    method: "DELETE",
    signal,
  })
}

export function uploadProjectContentImage(projectId: string, file: File) {
  const body = new FormData()
  body.set("file", file)
  return request<{ src: string }>(`/api/projects/${projectId}/content-images`, {
    method: "POST",
    body,
  })
}
