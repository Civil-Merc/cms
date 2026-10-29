import {
  Box,
  Button,
  Image,
  Portal,
  Text,
  Tooltip,
} from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"
import { LuArrowLeft, LuCircleHelp, LuImagePlus } from "react-icons/lu"
import type { ProjectItem } from "@/auth/admin/cms-pages"
import { deleteProject } from "@/auth/admin/projects-api"
import { CmsDialog } from "@/components/CmsDialog"
import { FieldInput } from "@/components/FieldInput"
import { ProcessingOverlay } from "@/components/ProcessingOverlay"
import { toaster } from "@/components/ui/toaster"

const MAX_IMAGE_BYTES = 2 * 1024 * 1024

type ProjectsTableProps = {
  projects: ProjectItem[]
  loading: boolean
  error: string
  onCreate: (input: { title: string; description: string; file: File }) => Promise<void>
  onDeleted: (id: string) => void
  onRetry: () => void
  onEdit: (id: string) => void
  onBack: () => void
}

const dimOnPress = {
  _hover: { opacity: 0.75 },
  _active: { opacity: 0.6 },
}

function formatEditedAt(iso: string | undefined) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export function ProjectsTable({
  projects,
  loading,
  error,
  onCreate,
  onDeleted,
  onRetry,
  onEdit,
  onBack,
}: ProjectsTableProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState("")
  const [formError, setFormError] = useState("")
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ProjectItem | null>(null)
  const [deleteError, setDeleteError] = useState("")
  const [deleting, setDeleting] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const deleteAbortRef = useRef<AbortController | null>(null)
  const createAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview("")
      return
    }
    const url = URL.createObjectURL(coverFile)
    setCoverPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [coverFile])

  const resetCover = () => {
    setCoverFile(null)
    setCoverPreview("")
  }

  const closeModal = () => {
    if (creating) return
    setOpen(false)
    setName("")
    setDescription("")
    resetCover()
    setFormError("")
  }

  const pickImage = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setFormError("")
    if (!file.type.startsWith("image/")) {
      setFormError("Choose an image file (PNG, JPG, or similar).")
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setFormError("Image must be 2 MB or smaller.")
      return
    }
    setCoverFile(file)
  }

  const createProject = async () => {
    const title = name.trim()
    if (!coverFile) {
      setFormError("Add a project image.")
      return
    }
    if (!title || creating) {
      if (!title) setFormError("Enter a project name.")
      return
    }

    const controller = new AbortController()
    createAbortRef.current = controller
    setCreating(true)
    setFormError("")
    let toastNotice: { type: "success" | "error"; title: string; description: string } | null = null
    try {
      await onCreate({ title, description: description.trim(), file: coverFile })
      setOpen(false)
      setName("")
      setDescription("")
      resetCover()
      toastNotice = {
        type: "success",
        title: "Project created",
        description: `${title} was saved to the database.`,
      }
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return
      const message = caught instanceof Error ? caught.message : "Could not create the project."
      setFormError(message)
      toastNotice = { type: "error", title: "Create failed", description: message }
    } finally {
      createAbortRef.current = null
      setCreating(false)
      if (toastNotice) toaster.create({ ...toastNotice, duration: 4500 })
    }
  }

  const closeDeleteDialog = () => {
    if (deleting) return
    setDeleteTarget(null)
    setDeleteError("")
  }

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return
    const target = deleteTarget
    const controller = new AbortController()
    deleteAbortRef.current = controller
    setDeleting(true)
    setDeleteError("")
    let toastNotice: { type: "success" | "error"; title: string; description: string } | null = null
    try {
      await deleteProject(target.id, controller.signal)
      onDeleted(target.id)
      setDeleteTarget(null)
      toastNotice = {
        type: "success",
        title: "Project deleted",
        description: `${target.title} was removed from the database.`,
      }
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return
      const message = caught instanceof Error ? caught.message : "Could not delete the project."
      setDeleteError(message)
      toastNotice = { type: "error", title: "Delete failed", description: message }
    } finally {
      deleteAbortRef.current = null
      setDeleting(false)
      if (toastNotice) toaster.create({ ...toastNotice, duration: 4500 })
    }
  }

  return (
    <Box>
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

      <Box
        display="flex"
        alignItems="flex-start"
        justifyContent="space-between"
        gap={3}
        mb={{ base: 5, sm: 6 }}
      >
        <Box minW={0}>
          <Box display="flex" alignItems="center" gap={2} mb={1}>
            <Text fontSize={{ base: "20px", sm: "22px" }} fontWeight="700">
              Projects
            </Text>
            <Tooltip.Root openDelay={200}>
              <Tooltip.Trigger asChild>
                <Box
                  as="button"
                  aria-label="How projects work"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  h="28px"
                  w="28px"
                  borderRadius="10px"
                  color="#6b6b6b"
                  cursor="pointer"
                  _hover={{ opacity: 0.75 }}
                  _active={{ opacity: 0.6 }}
                >
                  <LuCircleHelp size={16} />
                </Box>
              </Tooltip.Trigger>
              <Portal>
                <Tooltip.Positioner>
                  <Tooltip.Content
                    px={3}
                    py={2}
                    borderRadius="10px"
                    bg="#181818"
                    color="white"
                    fontSize="13px"
                    maxW="260px"
                  >
                    These are the projects CivilMerc has handled. Add each one here for the public site.
                  </Tooltip.Content>
                </Tooltip.Positioner>
              </Portal>
            </Tooltip.Root>
          </Box>
          <Text fontSize="15px" color="#6b6b6b">
            Manage the projects your company has delivered.
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
          {...dimOnPress}
          onClick={() => setOpen(true)}
        >
          New project
        </Button>
      </Box>

      {error ? (
        <Box mb={4} maxW="640px">
          <Text fontSize="14px" color="#8f2d2d" mb={3}>
            {error}
          </Text>
          <Button
            h="35px"
            px={4}
            borderRadius="10px"
            bg="#181818"
            color="white"
            fontSize="14px"
            fontWeight="600"
            {...dimOnPress}
            onClick={onRetry}
          >
            Try again
          </Button>
        </Box>
      ) : null}

      <Box
        bg="white"
        borderWidth="1px"
        borderColor="#e6e6e6"
        borderRadius="10px"
        overflow="hidden"
      >
        <Box as="table" w="full" style={{ borderCollapse: "collapse" }}>
          <Box as="thead" bg="#fafafa">
            <Box as="tr">
              <Box
                as="th"
                textAlign="left"
                fontSize="13px"
                fontWeight="700"
                color="#6b6b6b"
                px={{ base: 4, sm: 5 }}
                py={3}
              >
                Project
              </Box>
              <Box
                as="th"
                textAlign="left"
                fontSize="13px"
                fontWeight="700"
                color="#6b6b6b"
                px={{ base: 4, sm: 5 }}
                py={3}
                display={{ base: "none", md: "table-cell" }}
              >
                Last edited
              </Box>
              <Box as="th" px={{ base: 4, sm: 5 }} py={3} />
            </Box>
          </Box>
          <Box as="tbody">
            {loading ? (
              <Box as="tr">
                <Box as="td" px={{ base: 4, sm: 5 }} py={4}>
                  <Text fontSize="14px" color="#6b6b6b">
                    Loading projects…
                  </Text>
                </Box>
              </Box>
            ) : projects.length === 0 ? (
              <Box as="tr">
                <Box as="td" px={{ base: 4, sm: 5 }} py={4}>
                  <Text fontSize="14px" color="#6b6b6b">
                    No projects yet.
                  </Text>
                </Box>
              </Box>
            ) : (
              projects.map((project) => {
                const editedLabel = formatEditedAt(project.updatedAt)
                return (
                  <Box as="tr" key={project.id} borderTopWidth="1px" borderColor="#eeeeee">
                    <Box as="td" px={{ base: 4, sm: 5 }} py={4}>
                      <Box display="flex" alignItems="flex-start" gap={3}>
                        <Image
                          src={project.imageSrc}
                          alt=""
                          flexShrink={0}
                          w="72px"
                          h="72px"
                          borderRadius="10px"
                          objectFit="cover"
                          bg="#f1f1f1"
                        />
                        <Box minW={0}>
                          <Text fontSize="16px" fontWeight="600">
                            {project.title}
                          </Text>
                          {project.description ? (
                            <Text fontSize="14px" color="#6b6b6b" mt={1}>
                              {project.description}
                            </Text>
                          ) : null}
                          {editedLabel ? (
                            <Text fontSize="13px" color="#6b6b6b" mt={1} display={{ base: "block", md: "none" }}>
                              Edited {editedLabel}
                            </Text>
                          ) : null}
                        </Box>
                      </Box>
                    </Box>
                    <Box
                      as="td"
                      px={{ base: 4, sm: 5 }}
                      py={4}
                      display={{ base: "none", md: "table-cell" }}
                    >
                      <Text fontSize="14px" color="#6b6b6b">
                        {editedLabel ?? "—"}
                      </Text>
                    </Box>
                    <Box as="td" px={{ base: 4, sm: 5 }} py={4} textAlign="right">
                      <Box display="inline-flex" flexWrap="wrap" justifyContent="flex-end" gap={2}>
                        <Button
                          h="35px"
                          px={4}
                          borderRadius="10px"
                          bg="#181818"
                          color="white"
                          fontSize="14px"
                          fontWeight="600"
                          {...dimOnPress}
                          onClick={() => onEdit(project.id)}
                        >
                          Edit content
                        </Button>
                        <Button
                          h="35px"
                          px={4}
                          borderRadius="10px"
                          variant="outline"
                          borderColor="#e6e6e6"
                          color="#8f2d2d"
                          fontSize="14px"
                          fontWeight="600"
                          {...dimOnPress}
                          onClick={() => {
                            setDeleteError("")
                            setDeleteTarget(project)
                          }}
                        >
                          Delete
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                )
              })
            )}
          </Box>
        </Box>
      </Box>

      <CmsDialog
        open={open}
        onOpenChange={(event) => {
          if (event.open) setOpen(true)
          else closeModal()
        }}
        title="New project"
        footer={
          <>
            <Button
              h="35px"
              px={4}
              borderRadius="10px"
              variant="outline"
              borderColor="#e6e6e6"
              color="#181818"
              {...dimOnPress}
              disabled={creating}
              onClick={closeModal}
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
              {...dimOnPress}
              disabled={creating}
              onClick={() => void createProject()}
            >
              {creating ? "Creating…" : "Create project"}
            </Button>
          </>
        }
      >
        <Box display="flex" flexDirection="column" gap={3}>
          <Box>
            <Text fontSize="13px" fontWeight="600" mb={2}>
              Project image
            </Text>
            <Box
              as="button"
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              w="full"
              minH="140px"
              borderRadius="10px"
              borderWidth="1px"
              borderColor="#e6e6e6"
              borderStyle={coverPreview ? "solid" : "dashed"}
              bg="#fafafa"
              overflow="hidden"
              cursor="pointer"
              p={coverPreview ? 0 : 4}
              _hover={{ opacity: 0.85 }}
              _active={{ opacity: 0.7 }}
              onClick={() => imageInputRef.current?.click()}
            >
              {coverPreview ? (
                <Image src={coverPreview} alt="" w="full" h="160px" objectFit="cover" />
              ) : (
                <>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    h="40px"
                    w="40px"
                    borderRadius="full"
                    bg="#181818"
                    color="white"
                    mb={2}
                  >
                    <LuImagePlus size={18} />
                  </Box>
                  <Text fontSize="14px" fontWeight="600">
                    Upload project image
                  </Text>
                  <Text fontSize="13px" color="#6b6b6b" mt={1}>
                    PNG or JPG, up to 2 MB
                  </Text>
                </>
              )}
            </Box>
            {coverPreview ? (
              <Button
                mt={2}
                h="35px"
                px={3}
                borderRadius="10px"
                variant="outline"
                borderColor="#e6e6e6"
                color="#181818"
                fontSize="13px"
                {...dimOnPress}
                disabled={creating}
                onClick={() => imageInputRef.current?.click()}
              >
                Replace image
              </Button>
            ) : null}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                pickImage(event.target.files)
                event.target.value = ""
              }}
            />
          </Box>
          <FieldInput
            value={name}
            aria-label="Project name"
            placeholder="Project name"
            disabled={creating}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                void createProject()
              }
            }}
          />
          <FieldInput
            value={description}
            aria-label="Project description"
            placeholder="Description"
            disabled={creating}
            onChange={(event) => setDescription(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                void createProject()
              }
            }}
          />
          {formError ? (
            <Text fontSize="13px" color="#8f2d2d">
              {formError}
            </Text>
          ) : null}
        </Box>
      </CmsDialog>

      <CmsDialog
        open={Boolean(deleteTarget) && !deleting}
        onOpenChange={(event) => {
          if (!event.open) closeDeleteDialog()
        }}
        title="Delete project?"
        footer={
          <>
            <Button
              h="35px"
              px={4}
              borderRadius="10px"
              variant="outline"
              borderColor="#e6e6e6"
              color="#181818"
              {...dimOnPress}
              onClick={closeDeleteDialog}
            >
              Cancel
            </Button>
            <Button
              h="35px"
              px={4}
              borderRadius="10px"
              bg="#8f2d2d"
              color="white"
              fontWeight="600"
              {...dimOnPress}
              onClick={() => void confirmDelete()}
            >
              Delete project
            </Button>
          </>
        }
      >
        <Text fontSize="15px" color="#6b6b6b" lineHeight="1.5">
          {deleteTarget
            ? `This will permanently remove "${deleteTarget.title}" from the database, including its cover and gallery images.`
            : null}
        </Text>
        {deleteError ? (
          <Text mt={3} fontSize="13px" color="#8f2d2d">
            {deleteError}
          </Text>
        ) : null}
      </CmsDialog>

      <ProcessingOverlay
        open={creating}
        message="Creating project…"
        allowCancel
        onCancel={() => createAbortRef.current?.abort()}
      />

      <ProcessingOverlay
        open={deleting}
        message="Deleting project…"
        allowCancel
        onCancel={() => deleteAbortRef.current?.abort()}
      />
    </Box>
  )
}
