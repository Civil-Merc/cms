import type { ServiceItem } from "@/auth/admin/cms-pages"
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

export function parseService(raw: unknown): ServiceItem {
  if (!raw || typeof raw !== "object") {
    throw new Error("The service response was invalid.")
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

export async function listServices() {
  const result = await request<{ services: unknown[] }>("/api/services")
  return { services: result.services.map(parseService) }
}

export async function createService(input: { title: string; description: string; file: File }) {
  const body = new FormData()
  body.set("title", input.title)
  body.set("description", input.description)
  body.set("file", input.file)
  return parseService(
    await request<unknown>("/api/services", {
      method: "POST",
      body,
    }),
  )
}

export async function updateService(
  id: string,
  patch: Partial<Pick<ServiceItem, "title" | "description" | "content">>,
  signal?: AbortSignal,
) {
  return parseService(
    await request<unknown>(`/api/services/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
      signal,
    }),
  )
}

export async function uploadServiceCover(serviceId: string, file: File) {
  const body = new FormData()
  body.set("file", file)
  return parseService(
    await request<unknown>(`/api/services/${serviceId}/cover`, {
      method: "POST",
      body,
    }),
  )
}

export async function uploadServiceImage(serviceId: string, file: File) {
  const body = new FormData()
  body.set("file", file)
  const service = parseService(
    await request<unknown>(`/api/services/${serviceId}/images`, {
      method: "POST",
      body,
    }),
  )
  const image = service.gallery.at(-1)
  if (!image) throw new Error("The image was not saved.")
  return image
}

export async function deleteServiceImage(serviceId: string, imageId: string) {
  return parseService(
    await request<unknown>(`/api/services/${serviceId}/images/${imageId}`, {
      method: "DELETE",
    }),
  )
}

export function deleteService(id: string, signal?: AbortSignal) {
  return request<{ ok: true }>(`/api/services/${id}`, {
    method: "DELETE",
    signal,
  })
}

export function uploadContentImage(serviceId: string, file: File) {
  const body = new FormData()
  body.set("file", file)
  return request<{ src: string }>(`/api/services/${serviceId}/content-images`, {
    method: "POST",
    body,
  })
}
