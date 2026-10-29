import { Pool } from "pg"
import { ensureSuperAdminSeed } from "./admin-users.ts"

const databaseUrl = process.env.DATABASE_URL

export const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null

const schema = `
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  position integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_images (
  id uuid PRIMARY KEY,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name text NOT NULL,
  object_key text NOT NULL,
  position integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS service_images_service_id_idx ON service_images (service_id);

ALTER TABLE services ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE services ADD COLUMN IF NOT EXISTS cover_object_key text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS cover_name text NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS cms_pages (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS page_images (
  id uuid PRIMARY KEY,
  page_id text NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
  name text NOT NULL,
  object_key text NOT NULL,
  position integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS page_images_page_id_idx ON page_images (page_id);

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  cover_object_key text,
  cover_name text NOT NULL DEFAULT '',
  position integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_images (
  id uuid PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  object_key text NOT NULL,
  position integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_images_project_id_idx ON project_images (project_id);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);
`

let ready: Promise<void> | null = null

export function databaseReady() {
  if (!pool) {
    return Promise.reject(Object.assign(new Error("Set DATABASE_URL to connect Postgres."), { status: 503 }))
  }
  ready ??= pool
    .query(schema)
    .then(() => ensureSuperAdminSeed())
    .then(() => undefined)
    .catch((error: unknown) => {
      ready = null
      throw error
    })
  return ready
}
