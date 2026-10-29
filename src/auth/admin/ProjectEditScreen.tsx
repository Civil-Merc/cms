import { Box, Button, Grid, Image, Text } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"
import { LuArrowLeft } from "react-icons/lu"
import type { ProjectItem } from "@/auth/admin/cms-pages"
import { ImageGallery } from "@/auth/admin/ImageGallery"
import {
  deleteProjectImage,
  updateProject,
  uploadProjectContentImage,
  uploadProjectCover,
  uploadProjectImage,
} from "@/auth/admin/projects-api"
import { RichTextEditor } from "@/auth/admin/RichTextEditor"
import { CmsDialog } from "@/components/CmsDialog"
import { FieldInput } from "@/components/FieldInput"
import { primaryActionButton } from "@/theme/civilmerc-theme"
import { ProcessingOverlay } from "@/components/ProcessingOverlay"
import { toaster } from "@/components/ui/toaster"

type ProjectEditScreenProps = {
  project: ProjectItem
  onChange: (project: ProjectItem) => void
  onBack: () => void
}

export function ProjectEditScreen({ project, onChange, onBack }: ProjectEditScreenProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(project.title)
  const [description, setDescription] = useState(project.description)
  const [detailError, setDetailError] = useState("")
  const [savingDetails, setSavingDetails] = useState(false)
  const [content, setContent] = useState(project.content)
  const [contentError, setContentError] = useState("")
  const [savingContent, setSavingContent] = useState(false)
  const [coverError, setCoverError] = useState("")
  const [replacingCover, setReplacingCover] = useState(false)
  const [imageError, setImageError] = useState("")
  const saveAbortRef = useRef<AbortController | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const contentDirty = content !== project.content

  useEffect(() => {
    setContent(project.content)
    setContentError("")
    setImageError("")
    setCoverError("")
  }, [project.id])

  const openEditor = () => {
    setTitle(project.title)
    setDescription(project.description)
    setDetailError("")
    setOpen(true)
  }

  const saveDetails = async () => {
    const nextTitle = title.trim()
    if (!nextTitle) return
    setSavingDetails(true)
    setDetailError("")
    try {
      onChange(await updateProject(project.id, { title: nextTitle, description: description.trim() }))
      setOpen(false)
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Could not save the project.")
    } finally {
      setSavingDetails(false)
    }
  }

  const replaceCover = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setReplacingCover(true)
    setCoverError("")
    let toastNotice: { type: "success" | "error"; title: string; description: string } | null = null
    try {
      const saved = await uploadProjectCover(project.id, file)
      onChange(saved)
      toastNotice = {
        type: "success",
        title: "Cover updated",
        description: `${saved.title} cover image was saved.`,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update the cover image."
      setCoverError(message)
      toastNotice = { type: "error", title: "Cover not saved", description: message }
    } finally {
      setReplacingCover(false)
      if (toastNotice) toaster.create({ ...toastNotice, duration: 4500 })
    }
  }

  const saveContent = async () => {
    const controller = new AbortController()
    saveAbortRef.current = controller
    setSavingContent(true)
    setContentError("")
    let toastNotice: { type: "success" | "error"; title: string; description: string } | null = null
    try {
      const saved = await updateProject(project.id, { content }, controller.signal)
      onChange(saved)
      setContent(saved.content)
      toastNotice = {
        type: "success",
        title: "Content saved",
        description: `${project.title} was updated successfully.`,
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

      <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={3} mb={5}>
        <Box minW={0}>
          <Text fontSize={{ base: "22px", md: "28px" }} fontWeight="700">
            {project.title}
          </Text>
          <Text fontSize="15px" color="#6b6b6b" mt={1}>
            {project.description || "No description yet."}
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

      <Box
        bg="white"
        borderWidth="1px"
        borderColor="#e6e6e6"
        borderRadius="10px"
        p={{ base: 4, md: 5 }}
        mb={4}
      >
        <Text fontSize="14px" fontWeight="600" mb={2}>
          Project image
        </Text>
        {project.imageSrc ? (
          <Image
            src={project.imageSrc}
            alt=""
            w="full"
            maxH="240px"
            objectFit="cover"
            borderRadius="10px"
            bg="#f1f1f1"
            mb={2}
          />
        ) : null}
        <Button
          h="35px"
          px={4}
          borderRadius="10px"
          variant="outline"
          borderColor="#e6e6e6"
          color="#181818"
          _hover={{ opacity: 0.75 }}
          _active={{ opacity: 0.6 }}
          disabled={replacingCover}
          onClick={() => coverInputRef.current?.click()}
        >
          Replace image
        </Button>
        {coverError ? (
          <Text mt={2} fontSize="13px" color="#8f2d2d">
            {coverError}
          </Text>
        ) : null}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            void replaceCover(event.target.files)
            event.target.value = ""
          }}
        />
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
              key={project.id}
              value={content}
              onChange={setContent}
              uploadImage={(file) => uploadProjectContentImage(project.id, file).then((image) => image.src)}
              onImageError={setImageError}
            />
            {imageError ? (
              <Text mt={2} fontSize="13px" color="#8f2d2d">
                {imageError}
              </Text>
            ) : null}
          </Box>
          <ImageGallery
            images={project.gallery}
            uploadFile={(file) => uploadProjectImage(project.id, file)}
            onRemove={async (image) => {
              onChange(await deleteProjectImage(project.id, image.id))
            }}
            onChange={(gallery) => onChange({ ...project, gallery })}
          />
        </Box>
        <Box display={{ base: "none", md: "flex" }} flexDirection="column" gap={4}>
          {contentSaveCard()}
        </Box>
      </Grid>

      <CmsDialog
        open={open}
        onOpenChange={(event) => setOpen(event.open)}
        title="Edit project"
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
          <FieldInput
            value={title}
            aria-label="Project name"
            placeholder="Project name"
            onChange={(event) => setTitle(event.target.value)}
          />
          <FieldInput
            value={description}
            aria-label="Project description"
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
        open={savingContent || replacingCover}
        message={replacingCover ? "Updating cover…" : "Saving content…"}
        allowCancel={savingContent}
        onCancel={() => saveAbortRef.current?.abort()}
      />
    </Box>
  )
}
