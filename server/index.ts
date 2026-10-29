import "./env.ts"
import { existsSync } from "node:fs"
import { serve } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import { Hono } from "hono"
import { authRoutes } from "./auth-routes.ts"
import { apiCors } from "./cors.ts"
import { aboutPage } from "./pages.ts"
import { contactPage } from "./contact-page.ts"
import { publicAboutPage } from "./public/about-page.ts"
import { publicContactPage } from "./public/contact-page.ts"
import { publicProjects } from "./public/projects.ts"
import { publicServices } from "./public/services.ts"
import { projects } from "./projects.ts"
import { requireAuth } from "./require-auth.ts"
import { services } from "./services.ts"

const app = new Hono()

app.use("/api/*", apiCors())

app.get("/api/health", (c) => c.json({ ok: true }))
app.route("/api/auth", authRoutes)
app.route("/api/public/services", publicServices)
app.route("/api/public/projects", publicProjects)
app.route("/api/public/pages/about", publicAboutPage)
app.route("/api/public/pages/contact", publicContactPage)

const adminApi = new Hono()
adminApi.use("*", requireAuth)
adminApi.route("/services", services)
adminApi.route("/projects", projects)
adminApi.route("/pages/about", aboutPage)
adminApi.route("/pages/contact", contactPage)
app.route("/api", adminApi)

const webRoot = "./dist"
if (existsSync(webRoot)) {
  const files = serveStatic({ root: webRoot })
  const spa = serveStatic({ root: webRoot, path: "index.html" })
  const isApi = (path: string) => path === "/api" || path.startsWith("/api/")

  app.use("*", async (c, next) => {
    if (isApi(c.req.path)) return next()
    return files(c, next)
  })
  app.get("*", async (c, next) => {
    if (isApi(c.req.path)) return next()
    return spa(c, next)
  })
}

const port = Number(process.env.PORT ?? 3001)

serve({ fetch: app.fetch, hostname: "0.0.0.0", port }, () => {
  console.log(`CMS listening on http://0.0.0.0:${port}`)
})
