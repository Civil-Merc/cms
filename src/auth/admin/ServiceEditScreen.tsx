import { Box, Button, Grid, Text } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"
import { LuArrowLeft } from "react-icons/lu"
import type { ServiceItem } from "@/auth/admin/cms-pages"
import { ImageGallery } from "@/auth/admin/ImageGallery"
import { RichTextEditor } from "@/auth/admin/RichTextEditor"
import { deleteServiceImage, updateService, uploadContentImage, uploadServiceCover, uploadServiceImage } from "@/auth/admin/services-api"
import { CmsDialog } from "@/components/CmsDialog"
import { FieldInput } from "@/components/FieldInput"
import { ModalImageField } from "@/components/ModalImageField"
import { primaryActionButton } from "@/theme/civilmerc-theme"
import { ProcessingOverlay } from "@/components/ProcessingOverlay"
import { toaster } from "@/components/ui/toaster"

type ServiceEditScreenProps = {
  service: ServiceItem
  onChange: (service: ServiceItem) => void
  onBack: () => void
}

export function ServiceEditScreen({ service, onChange, onBack }: ServiceEditScreenProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(service.title)
  const [description, setDescription] = useState(service.description)
  const [detailError, setDetailError] = useState("")
  const [savingDetails, setSavingDetails] = useState(false)
  const [content, setContent] = useState(service.content)
  const [contentError, setContentError] = useState("")
  const [savingContent, setSavingContent] = useState(false)
  const [imageError, setImageError] = useState("")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState("")
  const saveAbortRef = useRef<AbortController | null>(null)
  const contentDirty = content !== service.content

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(service.imageSrc)
      return
    }
    const url = URL.createObjectURL(coverFile)
    setCoverPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [coverFile, service.imageSrc])

  useEffect(() => {
    setContent(service.content)
    setContentError("")
    setImageError("")
  }, [service.id])

  const openEditor = () => {
    setTitle(service.title)
    setDescription(service.description)
    setCoverFile(null)
    setCoverPreview(service.imageSrc)
    setDetailError("")
    setOpen(true)
  }

  const saveDetails = async () => {
    const nextTitle = title.trim()
    if (!nextTitle) return
    if (!coverFile && !service.imageSrc) {
      setDetailError("Add a service image.")
      return
    }
    setSavingDetails(true)
    setDetailError("")
    try {
      let saved = await updateService(service.id, { title: nextTitle, description: description.trim() })
      if (coverFile) {
        saved = await uploadServiceCover(service.id, coverFile)
      }
      onChange(saved)
      setCoverFile(null)
      setOpen(false)
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Could not save the service.")
    } finally {
      setSavingDetails(false)
    }
  }

  const saveContent = async () => {
    const controller = new AbortController()
    saveAbortRef.current = controller
    setSavingContent(true)
    setContentError("")
    let toastNotice: { type: "success" | "error"; title: string; description: string } | null = null
    try {
      const saved = await updateService(service.id, { content }, controller.signal)
      onChange(saved)
      setContent(saved.content)
      toastNotice = {
        type: "success",
        title: "Content saved",
        description: `${service.title} was updated successfully.`,
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      const message = error instanceof Error ? error.message : "Could not save the content."
      setContentError(message)
      toastNotice = {
        type: "error",
        title: "Content not saved",
        description: message,
      }
    } finally {
      saveAbortRef.current = null
      setSavingContent(false)
      if (toastNotice) {
        toaster.create({ ...toastNotice, duration: 4500 })
      }
    }
  }

  const contentSaveCard = () => (
    <Box bg="white" borderWidth="1px" borderColor="#e6e6e6" borderRadius="10px" p={4}>
      <Text fontSize="12px" fontWeight="700" letterSpacing="0.08em" color="#6b6b6b" mb={3}>
        CONTENT
      </Text>
      <Text fontSize="13px" color={contentError ? "#8f2d2d" : "#6b6b6b"} mb={3} lineHeight="1.4">
        {contentError || (contentDirty ? "Unsaved content changes." : "Content is saved.")}
      </Text>
      <Button
        w="full"
        h="35px"
        borderRadius="10px"
        disabled={!contentDirty || savingContent}
        {...primaryActionButton}
        onClick={() => void saveContent()}
      >
        {savingContent ? "Saving…" : "Save content"}
      </Button>
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
        _hover={{ opacity: 0.75 }}
        _active={{ opacity: 0.6 }}
        onClick={onBack}
      >
        <LuArrowLeft size={16} />
        Back
      </Button>

      <Box
        display="flex"
        alignItems="flex-start"
        justifyContent="space-between"
        gap={3}
        mb={5}
      >
        <Box minW={0}>
          <Text fontSize={{ base: "22px", md: "28px" }} fontWeight="700">
            {service.title}
          </Text>
          <Text fontSize="15px" color="#6b6b6b" mt={1}>
            {service.description || "No description yet."}
          </Text>
        </Box>
        <Button
          flexShrink={0}
          h="35px"
          px={4}
          borderRadius="10px"
          bg="#181818"
          color="white"
          fontSize="14px"
          fontWeight="600"
          _hover={{ opacity: 0.75 }}
          _active={{ opacity: 0.6 }}
          onClick={openEditor}
        >
          Edit
        </Button>
      </Box>

      <Grid display={{ base: "grid", md: "none" }} templateColumns="1fr" gap={4} mb={4}>
        {contentSaveCard()}
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
            <Text fontSize="14px" fontWeight="600" mb={2}>
              Content
            </Text>
            <RichTextEditor
              key={service.id}
              value={content}
              onChange={setContent}
              uploadImage={(file) => uploadContentImage(service.id, file).then((image) => image.src)}
              onImageError={setImageError}
            />
            {imageError ? (
              <Text mt={2} fontSize="13px" color="#8f2d2d">
                {imageError}
              </Text>
            ) : null}
          </Box>
          <ImageGallery
            images={service.gallery}
            uploadFile={(file) => uploadServiceImage(service.id, file)}
            onRemove={async (image) => {
              await deleteServiceImage(service.id, image.id)
            }}
            onChange={(gallery) => onChange({ ...service, gallery })}
          />
        </Box>
        <Box display={{ base: "none", md: "flex" }} flexDirection="column" gap={4}>
          {contentSaveCard()}
        </Box>
      </Grid>

      <CmsDialog
        open={open}
        onOpenChange={(event) => setOpen(event.open)}
        title="Edit service"
        footer={
          <>
            <Button
              h="35px"
              px={4}
              borderRadius="10px"
              variant="outline"
              borderColor="#e6e6e6"
              color="#181818"
              _hover={{ opacity: 0.75 }}
              _active={{ opacity: 0.6 }}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              h="35px"
              px={4}
              borderRadius="10px"
              bg="#181818"
              color="white"
              fontWeight="600"
              _hover={{ opacity: 0.75 }}
              _active={{ opacity: 0.6 }}
              disabled={savingDetails}
              onClick={() => void saveDetails()}
            >
              {savingDetails ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <Box display="flex" flexDirection="column" gap={3}>
          <ModalImageField
            label="Service image"
            preview={coverPreview}
            disabled={savingDetails}
            onPick={setCoverFile}
            onError={setDetailError}
          />
          <FieldInput
            value={title}
            aria-label="Service name"
            placeholder="Service name"
            onChange={(event) => setTitle(event.target.value)}
          />
          <FieldInput
            value={description}
            aria-label="Service description"
            placeholder="Description"
            onChange={(event) => setDescription(event.target.value)}
          />
        </Box>
        {detailError ? (
          <Text mt={3} fontSize="13px" color="#8f2d2d">
            {detailError}
          </Text>
        ) : null}
      </CmsDialog>

      <ProcessingOverlay
        open={savingContent}
        message="Saving content…"
        allowCancel
        onCancel={() => saveAbortRef.current?.abort()}
      />
    </Box>
  )
}
