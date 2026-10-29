import { Box, Button, Field, Grid, IconButton, Text, Textarea } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"
import { LuArrowLeft, LuPlus, LuTrash2 } from "react-icons/lu"
import type { ContactPage } from "@/auth/admin/cms-pages"
import { updateContactPage } from "@/auth/admin/pages-api"
import { FieldInput } from "@/components/FieldInput"
import { PageStatusBadge } from "@/components/PageStatusBadge"
import { ProcessingOverlay } from "@/components/ProcessingOverlay"
import { toaster } from "@/components/ui/toaster"
import { primaryActionButton } from "@/theme/civilmerc-theme"

type ContactEditScreenProps = {
  page: ContactPage
  onChange: (page: ContactPage) => void
  onBack: () => void
}

const dimOnPress = {
  _hover: { opacity: 0.75 },
  _active: { opacity: 0.6 },
}

type ToastNotice = { type: "success" | "error"; title: string; description: string }

function normalizePhones(phones: string[]) {
  return phones.map((phone) => phone.trim()).filter(Boolean)
}

function phonesEqual(a: string[], b: string[]) {
  return JSON.stringify(normalizePhones(a)) === JSON.stringify(normalizePhones(b))
}

function initialPhoneRows(phones: string[]) {
  return phones.length ? [...phones] : [""]
}

export function ContactEditScreen({ page, onChange, onBack }: ContactEditScreenProps) {
  const [address, setAddress] = useState(page.address)
  const [email, setEmail] = useState(page.email)
  const [phones, setPhones] = useState<string[]>(() => initialPhoneRows(page.phones))
  const [pageError, setPageError] = useState("")
  const [busy, setBusy] = useState(false)
  const [busyMessage, setBusyMessage] = useState("Processing, please wait")
  const abortRef = useRef<AbortController | null>(null)

  const pageDirty =
    address.trim() !== page.address.trim() ||
    email.trim() !== page.email.trim() ||
    !phonesEqual(phones, page.phones)

  useEffect(() => {
    setAddress(page.address)
    setEmail(page.email)
    setPhones(initialPhoneRows(page.phones))
    setPageError("")
  }, [page.id, page.address, page.email, page.phones, page.status])

  const runAction = async (
    message: string,
    work: (signal: AbortSignal) => Promise<ToastNotice | null>,
  ) => {
    const controller = new AbortController()
    abortRef.current = controller
    setBusyMessage(message)
    setBusy(true)
    let toastNotice: ToastNotice | null = null
    try {
      toastNotice = await work(controller.signal)
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      const text = error instanceof Error ? error.message : "The request failed."
      toastNotice = { type: "error", title: "Something went wrong", description: text }
    } finally {
      abortRef.current = null
      setBusy(false)
      if (toastNotice) toaster.create({ ...toastNotice, duration: 4500 })
    }
  }

  const contactPayload = () => ({
    address: address.trim(),
    email: email.trim(),
    phones: normalizePhones(phones),
  })

  const applySaved = (saved: ContactPage) => {
    onChange(saved)
    setAddress(saved.address)
    setEmail(saved.email)
    setPhones(initialPhoneRows(saved.phones))
  }

  const savePage = () =>
    void runAction("Saving page…", async (signal) => {
      setPageError("")
      try {
        const saved = await updateContactPage(contactPayload(), signal)
        applySaved(saved)
        return {
          type: "success",
          title: "Page saved",
          description: "Contact details were updated.",
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") throw error
        const text = error instanceof Error ? error.message : "Could not save the page."
        setPageError(text)
        return { type: "error", title: "Page not saved", description: text }
      }
    })

  const publishPage = () =>
    void runAction("Publishing…", async (signal) => {
      setPageError("")
      try {
        const saved = await updateContactPage({ ...contactPayload(), status: "published" }, signal)
        applySaved(saved)
        return {
          type: "success",
          title: "Page published",
          description: "Contact Us is now Published.",
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") throw error
        const text = error instanceof Error ? error.message : "Could not publish the page."
        setPageError(text)
        return { type: "error", title: "Publish failed", description: text }
      }
    })

  const updatePhone = (index: number, value: string) => {
    setPhones((current) => current.map((phone, i) => (i === index ? value : phone)))
  }

  const removePhone = (index: number) => {
    setPhones((current) => (current.length <= 1 ? [""] : current.filter((_, i) => i !== index)))
  }

  const addPhone = () => {
    setPhones((current) => [...current, ""])
  }

  const sidebarCards = () => (
    <Box bg="white" borderWidth="1px" borderColor="#e6e6e6" borderRadius="10px" p={4}>
      <Text fontSize="12px" fontWeight="700" letterSpacing="0.08em" color="#6b6b6b" mb={3}>
        STATUS
      </Text>
      <Box mb={3}>
        <PageStatusBadge status={page.status} size="md" />
      </Box>
      <Button
        w="full"
        h="35px"
        mb={2}
        borderRadius="10px"
        disabled={page.status === "published" || busy}
        {...primaryActionButton}
        onClick={publishPage}
      >
        Publish
      </Button>
      <Button
        w="full"
        h="35px"
        borderRadius="10px"
        variant="outline"
        borderColor="#e6e6e6"
        color="#181818"
        disabled={!pageDirty || busy}
        {...dimOnPress}
        onClick={savePage}
      >
        Save page
      </Button>
      {pageError ? (
        <Text mt={3} fontSize="13px" color="#8f2d2d">
          {pageError}
        </Text>
      ) : null}
    </Box>
  )

  return (
    <Box color="#181818">
      <Button
        variant="ghost"
        h="35px"
        px={2}
        mb={3}
        color="#181818"
        borderRadius="10px"
        {...dimOnPress}
        onClick={onBack}
      >
        <LuArrowLeft size={16} />
        Back
      </Button>

      <Box display="flex" alignItems="center" gap={2} flexWrap="wrap" mb={5}>
        <Text fontSize={{ base: "22px", md: "28px" }} fontWeight="700">
          {page.title}
        </Text>
        <PageStatusBadge status={page.status} />
      </Box>

      <Grid display={{ base: "grid", md: "none" }} templateColumns="1fr" gap={4} mb={4}>
        {sidebarCards()}
      </Grid>

      <Grid templateColumns={{ base: "1fr", md: "minmax(0, 1fr) 240px" }} gap={4} alignItems="start">
        <Box
          bg="white"
          borderWidth="1px"
          borderColor="#e6e6e6"
          borderRadius="10px"
          p={{ base: 4, md: 5 }}
          minW={0}
        >
          <Field.Root mb={4}>
            <Field.Label color="#181818" fontSize="14px" mb={1}>
              Address
            </Field.Label>
            <Textarea
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              minH="96px"
              borderRadius="10px"
              bg="#f1f1f1"
              borderColor="transparent"
              color="#181818"
              _hover={{ borderColor: "transparent" }}
              _focusVisible={{ borderColor: "transparent", boxShadow: "none", outline: "none", bg: "#f1f1f1" }}
            />
          </Field.Root>
          <Field.Root mb={4}>
            <Field.Label color="#181818" fontSize="14px" mb={1}>
              Email
            </Field.Label>
            <FieldInput
              value={email}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="office@civilmerc.com"
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field.Root>
          <Field.Root>
            <Field.Label color="#181818" fontSize="14px" mb={2}>
              Phone numbers
            </Field.Label>
            <Box display="flex" flexDirection="column" gap={2}>
              {phones.map((phone, index) => (
                <Box key={index} display="flex" alignItems="center" gap={2}>
                  <Box flex="1" minW={0}>
                    <FieldInput
                      value={phone}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="Phone number"
                      aria-label={`Phone number ${index + 1}`}
                      onChange={(event) => updatePhone(index, event.target.value)}
                    />
                  </Box>
                  <IconButton
                    aria-label={`Remove phone number ${index + 1}`}
                    h="45px"
                    minW="45px"
                    borderRadius="10px"
                    variant="outline"
                    borderColor="#e6e6e6"
                    color="#8f2d2d"
                    {...dimOnPress}
                    onClick={() => removePhone(index)}
                  >
                    <LuTrash2 size={16} />
                  </IconButton>
                </Box>
              ))}
            </Box>
            <Button
              mt={3}
              h="35px"
              px={3}
              borderRadius="10px"
              variant="outline"
              borderColor="#e6e6e6"
              color="#181818"
              fontSize="14px"
              {...dimOnPress}
              onClick={addPhone}
            >
              <LuPlus size={14} />
              Add phone number
            </Button>
          </Field.Root>
        </Box>
        <Box display={{ base: "none", md: "flex" }} flexDirection="column" gap={4}>
          {sidebarCards()}
        </Box>
      </Grid>

      <ProcessingOverlay
        open={busy}
        message={busyMessage}
        allowCancel
        onCancel={() => abortRef.current?.abort()}
      />
    </Box>
  )
}
