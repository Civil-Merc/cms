# CivilMerc CMS — Public read API

Read-only JSON endpoints for the marketing website. No authentication required.

**Base URL:** configure in the website (e.g. `https://api.example.com` or, in local dev with this repo’s Vite proxy, same origin as the site with path prefix `/api`).

All paths below are relative to that base (full path example: `{base}/public/services`).

---

## Conventions

| Topic | Detail |
|--------|--------|
| **Method** | `GET` only on these routes |
| **Content-Type** | `application/json` |
| **Errors** | `{ "error": "message" }` with HTTP status `400`, `404`, `503`, or `500` |
| **Caching** | `Cache-Control: public, max-age=60, stale-while-revalidate=300` and an `ETag` header on every response |
| **Timestamps** | `updatedAt` is ISO 8601 (UTC) |
| **Images** | `imageSrc` / `src` are absolute public URLs (Cloudflare R2) |
| **Rich text** | `content` is HTML from the CMS editor |
| **List order** | Services and projects: CMS `position`, then `created_at` |
| **Pages** | About Us and Contact Us return **404** unless status is **Published** in the CMS |

---

## Services

### List services (cards / index)

```
GET /public/services
```

**200**

```json
{
  "services": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "imageSrc": "https://…",
      "imageName": "string",
      "updatedAt": "2026-10-29T12:00:00.000Z"
    }
  ]
}
```

Omits `content` and `gallery` for a lighter payload.

---

### Service detail

```
GET /public/services/:id
```

`:id` — service UUID.

**200**

```json
{
  "service": {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "content": "<p>…</p>",
    "imageSrc": "https://…",
    "imageName": "string",
    "updatedAt": "2026-10-29T12:00:00.000Z",
    "gallery": [
      { "id": "uuid", "name": "string", "src": "https://…" }
    ]
  }
}
```

**Errors:** `400` invalid UUID · `404` not found

---

## Projects

### List projects (cards / index)

```
GET /public/projects
```

**200**

```json
{
  "projects": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "imageSrc": "https://…",
      "imageName": "string",
      "updatedAt": "2026-10-29T12:00:00.000Z"
    }
  ]
}
```

Same summary shape as services (no `content` or `gallery`).

---

### Project detail

```
GET /public/projects/:id
```

`:id` — project UUID.

**200**

```json
{
  "project": {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "content": "<p>…</p>",
    "imageSrc": "https://…",
    "imageName": "string",
    "updatedAt": "2026-10-29T12:00:00.000Z",
    "gallery": [
      { "id": "uuid", "name": "string", "src": "https://…" }
    ]
  }
}
```

**Errors:** `400` invalid UUID · `404` not found

---

## About Us

Single page (fixed id `about` in CMS).

```
GET /public/pages/about
```

**200** — only when the page is **Published**

```json
{
  "page": {
    "id": "about",
    "title": "string",
    "description": "string",
    "content": "<p>…</p>",
    "updatedAt": "2026-10-29T12:00:00.000Z",
    "gallery": [
      { "id": "uuid", "name": "string", "src": "https://…" }
    ]
  }
}
```

No `status` field on the public payload.

**404** — draft, missing row, or not published (`{ "error": "About page not found." }`)

---

## Contact Us

Single page (fixed id `contact` in CMS).

```
GET /public/pages/contact
```

**200** — only when the page is **Published**

```json
{
  "page": {
    "id": "contact",
    "title": "string",
    "address": "string",
    "email": "string",
    "phones": ["string"],
    "updatedAt": "2026-10-29T12:00:00.000Z"
  }
}
```

No `status` field on the public payload.

**404** — draft, missing row, or not published (`{ "error": "Contact page not found." }`)

---

## Quick reference

| Section | List | Detail |
|---------|------|--------|
| Services | `GET /public/services` | `GET /public/services/:id` |
| Projects | `GET /public/projects` | `GET /public/projects/:id` |
| About Us | — | `GET /public/pages/about` |
| Contact Us | — | `GET /public/pages/contact` |

---

## Example (fetch)

```js
const API = "https://your-cms-api.example.com/api"

const services = await fetch(`${API}/public/services`).then((r) => r.json())
const service = await fetch(`${API}/public/services/${id}`).then((r) => r.json())
const projects = await fetch(`${API}/public/projects`).then((r) => r.json())
const project = await fetch(`${API}/public/projects/${id}`).then((r) => r.json())
const about = await fetch(`${API}/public/pages/about`).then((r) => r.json())
const contact = await fetch(`${API}/public/pages/contact`).then((r) => r.json())
```

When this API runs as part of `civilmerc-cms` (`npm run dev`), routes are mounted under `/api` on port **3001** (e.g. `http://127.0.0.1:3001/api/public/services`).
