import { Hono } from "hono"
import {
  CONTACT_PAGE_ID,
  fail,
  optionalContactText,
  parsePhones,
  query,
  readContactPage,
  serializeContact,
} from "./contact-page-data.ts"
import { handleApiError } from "./api-errors.ts"

export { CONTACT_PAGE_ID } from "./contact-page-data.ts"
export type { ContactRecord } from "./contact-page-data.ts"

export const contactPage = new Hono()

contactPage.onError((error, c) => handleApiError(error, c))

contactPage.get("/", async (c) => c.json(await readContactPage()))

contactPage.patch("/", async (c) => {
  const current = await readContactPage()
  const body = await c.req.json().catch(() => fail(400, "Send the page as JSON."))
  const address =
    body.address === undefined ? current.address : (optionalContactText(body.address, "Address", 500) ?? "")
  const email = body.email === undefined ? current.email : (optionalContactText(body.email, "Email", 180) ?? "")
  const phones = body.phones === undefined ? current.phones : parsePhones(body.phones) ?? []
  let status = current.status
  if (body.status !== undefined) {
    if (body.status !== "draft" && body.status !== "published") fail(400, "Status must be draft or published.")
    status = body.status
  }
  const content = serializeContact({ address, email, phones })
  await query(
    "UPDATE cms_pages SET content = $2, status = $3, updated_at = now() WHERE id = $1",
    [CONTACT_PAGE_ID, content, status],
  )
  return c.json(await readContactPage())
})
