import { Box, Button, Field, Grid, Input, Text, Textarea } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"
import { LuArrowLeft } from "react-icons/lu"
import type { AboutPage } from "@/auth/admin/cms-pages"
import { ImageGallery } from "@/auth/admin/ImageGallery"
import {
  deleteAboutImage,
  updateAboutPage,
  uploadAboutContentImage,
  uploadAboutImage,
} from "@/auth/admin/pages-api"
import { RichTextEditor } from "@/auth/admin/RichTextEditor"
import { fieldInputProps } from "@/components/FieldInput"
import { PageEditorStatusCard } from "@/components/PageEditorStatusCard"
import { PageStatusBadge } from "@/components/PageStatusBadge"
import { ProcessingOverlay } from "@/components/ProcessingOverlay"
import { toaster } from "@/components/ui/toaster"

type AboutEditScreenProps = {
  page: AboutPage
  onChange: (page: AboutPage) => void
  onBack: () => void
}

const dimOnPress = {
  _hover: { opacity: 0.75 },
  _active: { opacity: 0.6 },
}

type ToastNotice = { type: "success" | "error"; title: string; description: string }

export function AboutEditScreen({ page, onChange, onBack }: AboutEditScreenProps) {
  const [title, setTitle] = useState(page.title)
  const [description, setDescription] = useState(page.description)
  const [content, setContent] = useState(page.content)
  const [pageError, setPageError] = useState("")
  const [imageError, setImageError] = useState("")
  const [busy, setBusy] = useState(false)
  const [busyMessage, setBusyMessage] = useState("Processing, please wait")
  const abortRef = useRef<AbortController | null>(null)

  const pageDirty =
    title !== page.title || description !== page.description || content !== page.content

  useEffect(() => {
    setTitle(page.title)
    setDescription(page.description)
    setContent(page.content)
    setPageError("")
    setImageError("")
  }, [page.id, page.title, page.description, page.content, page.status])

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

  const savePage = () =>
    void runAction("Saving page…", async (signal) => {
      setPageError("")
      try {
        const saved = await updateAboutPage(
          { title: title.trim(), description: description.trim(), content },
          signal,
        )
        onChange(saved)
        setTitle(saved.title)
        setDescription(saved.description)
        setContent(saved.content)
        return {
          type: "success",
          title: "Page saved",
          description: "About Us was updated.",
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
        const saved = await updateAboutPage(
          {
            title: title.trim(),
            description: description.trim(),
            content,
            status: "published",
          },
          signal,
        )
        onChange(saved)
        setTitle(saved.title)
        setDescription(saved.description)
        setContent(saved.content)
        return {
          type: "success",
          title: "Page published",
          description: "About Us is now Published.",
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") throw error
        const text = error instanceof Error ? error.message : "Could not publish the page."
        setPageError(text)
        return { type: "error", title: "Publish failed", description: text }
      }
    })

  const sidebarCards = () => (
    <PageEditorStatusCard
      status={page.status}
      pageDirty={pageDirty}
      busy={busy}
      pageError={pageError}
      onPublish={publishPage}
      onSave={savePage}
    />
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
        <Box display="flex" flexDirection="column" gap={4} minW={0}>
          <Box
            bg="white"
            borderWidth="1px"
            borderColor="#e6e6e6"
            borderRadius="10px"
            p={{ base: 4, md: 5 }}
          >
            <Field.Root mb={4}>
              <Field.Label color="#181818" fontSize="14px" mb={1}>
                Title
              </Field.Label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} {...fieldInputProps} />
            </Field.Root>
            <Field.Root mb={4}>
              <Field.Label color="#181818" fontSize="14px" mb={1}>
                Description
              </Field.Label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                minH="96px"
                borderRadius="10px"
                bg="#f1f1f1"
                borderColor="transparent"
                color="#181818"
                _hover={{ borderColor: "transparent" }}
                _focusVisible={{ borderColor: "transparent", boxShadow: "none", outline: "none", bg: "#f1f1f1" }}
              />
            </Field.Root>
            <Text fontSize="14px" fontWeight="600" mb={2}>
              Content
            </Text>
            <RichTextEditor
              key={page.id}
              value={content}
              onChange={setContent}
              uploadImage={(file) => uploadAboutContentImage(file).then((image) => image.src)}
              onImageError={setImageError}
            />
            {imageError ? (
              <Text mt={2} fontSize="13px" color="#8f2d2d">
                {imageError}
              </Text>
            ) : null}
          </Box>
          <ImageGallery
            images={page.gallery}
            uploadFile={async (file) => {
              const result = await uploadAboutImage(file)
              onChange(result.page)
              return result.image
            }}
            onRemove={async (image) => {
              onChange(await deleteAboutImage(image.id))
            }}
            onChange={(gallery) => onChange({ ...page, gallery })}
          />
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
