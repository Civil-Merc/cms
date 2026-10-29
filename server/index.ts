import "./env.ts"
import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { authRoutes } from "./auth-routes.ts"
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

const port = Number(process.env.PORT ?? 3001)

serve({ fetch: app.fetch, port }, () => {
  console.log(`API listening on http://127.0.0.1:${port}`)
})
