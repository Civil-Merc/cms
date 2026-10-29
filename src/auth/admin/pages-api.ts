import type { AboutPage, ContactPage } from "@/auth/admin/cms-pages"
import type { GalleryImage } from "@/auth/admin/ImageGallery"
import { adminRequest as request } from "@/auth/admin/admin-fetch"

function parseStatus(value: unknown): AboutPage["status"] {
  return value === "published" ? "published" : "draft"
}

function parseUpdatedAt(raw: Record<string, unknown>) {
  const value = raw.updatedAt ?? raw.updated_at
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "string" && value.trim()) return value
  return ""
}

export function parseAboutPage(raw: unknown): AboutPage {
  if (!raw || typeof raw !== "object") {
    throw new Error("The about page response was invalid.")
  }
  const record = raw as Record<string, unknown>
  const gallery = Array.isArray(record.gallery) ? (record.gallery as GalleryImage[]) : []

  return {
    id: "about",
    title: String(record.title ?? ""),
    description: String(record.description ?? ""),
    content: String(record.content ?? ""),
    status: parseStatus(record.status),
    updatedAt: parseUpdatedAt(record),
    gallery,
  }
}

export async function getAboutPage() {
  return parseAboutPage(await request<unknown>("/api/pages/about"))
}

export async function updateAboutPage(
  patch: Partial<Pick<AboutPage, "title" | "description" | "content" | "status">>,
  signal?: AbortSignal,
) {
  return parseAboutPage(
    await request<unknown>("/api/pages/about", {
      method: "PATCH",
      body: JSON.stringify(patch),
      signal,
    }),
  )
}

export async function uploadAboutImage(file: File) {
  const body = new FormData()
  body.set("file", file)
  const page = parseAboutPage(
    await request<unknown>("/api/pages/about/images", {
      method: "POST",
      body,
    }),
  )
  const image = page.gallery.at(-1)
  if (!image) throw new Error("The image was not saved.")
  return { page, image }
}

export async function deleteAboutImage(imageId: string) {
  return parseAboutPage(
    await request<unknown>(`/api/pages/about/images/${imageId}`, {
      method: "DELETE",
    }),
  )
}

export function uploadAboutContentImage(file: File) {
  const body = new FormData()
  body.set("file", file)
  return request<{ src: string }>("/api/pages/about/content-images", {
    method: "POST",
    body,
  })
}

function parseContactStatus(value: unknown): ContactPage["status"] {
  return value === "published" ? "published" : "draft"
}

export function parseContactPage(raw: unknown): ContactPage {
  if (!raw || typeof raw !== "object") {
    throw new Error("The contact page response was invalid.")
  }
  const record = raw as Record<string, unknown>
  const phones = Array.isArray(record.phones)
    ? record.phones.filter((phone): phone is string => typeof phone === "string").map((phone) => phone.trim())
    : []

  return {
    id: "contact",
    title: String(record.title ?? "Contact Us"),
    status: parseContactStatus(record.status),
    updatedAt: parseUpdatedAt(record),
    address: String(record.address ?? ""),
    email: String(record.email ?? ""),
    phones,
  }
}

export async function getContactPage() {
  return parseContactPage(await request<unknown>("/api/pages/contact"))
}

export async function updateContactPage(
  patch: Partial<Pick<ContactPage, "address" | "email" | "phones" | "status">>,
  signal?: AbortSignal,
) {
  return parseContactPage(
    await request<unknown>("/api/pages/contact", {
      method: "PATCH",
      body: JSON.stringify(patch),
      signal,
    }),
  )
}
