import {
  Box,
  Button,
  Image,
  Portal,
  Text,
  Tooltip,
} from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"
import { LuArrowLeft, LuCircleHelp } from "react-icons/lu"
import type { ServiceItem } from "@/auth/admin/cms-pages"
import { deleteService } from "@/auth/admin/services-api"
import { CmsDialog } from "@/components/CmsDialog"
import { FieldInput } from "@/components/FieldInput"
import { ModalImageField } from "@/components/ModalImageField"
import { ProcessingOverlay } from "@/components/ProcessingOverlay"
import { toaster } from "@/components/ui/toaster"

type ServicesTableProps = {
  services: ServiceItem[]
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

export function ServicesTable({
  services,
  loading,
  error,
  onCreate,
  onDeleted,
  onRetry,
  onEdit,
  onBack,
}: ServicesTableProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState("")
  const [formError, setFormError] = useState("")
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ServiceItem | null>(null)
  const [deleteError, setDeleteError] = useState("")
  const [deleting, setDeleting] = useState(false)
  const deleteAbortRef = useRef<AbortController | null>(null)

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

  const createService = async () => {
    const title = name.trim()
    if (!coverFile) {
      setFormError("Add a service image.")
      return
    }
    if (!title || creating) {
      if (!title) setFormError("Enter a service name.")
      return
    }
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
        title: "Service created",
        description: `${title} was saved to the database.`,
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not create the service."
      setFormError(message)
      toastNotice = { type: "error", title: "Create failed", description: message }
    } finally {
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
      await deleteService(target.id, controller.signal)
      onDeleted(target.id)
      setDeleteTarget(null)
      toastNotice = {
        type: "success",
        title: "Service deleted",
        description: `${target.title} was removed from the database.`,
      }
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return
      const message = caught instanceof Error ? caught.message : "Could not delete the service."
      setDeleteError(message)
      toastNotice = {
        type: "error",
        title: "Delete failed",
        description: message,
      }
    } finally {
      deleteAbortRef.current = null
      setDeleting(false)
      if (toastNotice) {
        toaster.create({ ...toastNotice, duration: 4500 })
      }
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
              Services
            </Text>
            <Tooltip.Root openDelay={200}>
              <Tooltip.Trigger asChild>
                <Box
                  as="button"
                  aria-label="How services work"
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
                    These are the services already on the page. Use Edit content to open the editor for one of them.
                  </Tooltip.Content>
                </Tooltip.Positioner>
              </Portal>
            </Tooltip.Root>
          </Box>
          <Text fontSize="15px" color="#6b6b6b">
            Choose a service to edit its main content.
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
          New service
        </Button>
      </Box>

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
                Service
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
              <Box as="th" w={{ base: "200px", sm: "260px" }} px={{ base: 4, sm: 5 }} py={3} />
            </Box>
          </Box>
          <Box as="tbody">
            {loading ? (
              <Box as="tr">
                <Box as="td" px={{ base: 4, sm: 5 }} py={4}>
                  <Text fontSize="14px" color="#6b6b6b">
                    Loading services…
                  </Text>
                </Box>
              </Box>
            ) : error ? (
              <Box as="tr">
                <Box as="td" px={{ base: 4, sm: 5 }} py={4}>
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
              </Box>
            ) : services.length === 0 ? (
              <Box as="tr">
                <Box as="td" px={{ base: 4, sm: 5 }} py={4}>
                  <Text fontSize="14px" color="#6b6b6b">
                    No services yet.
                  </Text>
                </Box>
              </Box>
            ) : (
              services.map((service) => {
                const editedLabel = formatEditedAt(service.updatedAt)
                return (
                <Box as="tr" key={service.id} borderTopWidth="1px" borderColor="#eeeeee">
                  <Box as="td" px={{ base: 4, sm: 5 }} py={4}>
                    <Box display="flex" alignItems="flex-start" gap={3}>
                      {service.imageSrc ? (
                        <Image
                          src={service.imageSrc}
                          alt=""
                          flexShrink={0}
                          w="72px"
                          h="72px"
                          borderRadius="10px"
                          objectFit="cover"
                          bg="#f1f1f1"
                        />
                      ) : (
                        <Box
                          flexShrink={0}
                          w="72px"
                          h="72px"
                          borderRadius="10px"
                          bg="#f1f1f1"
                        />
                      )}
                      <Box minW={0}>
                    <Text fontSize="16px" fontWeight="600">
                      {service.title}
                    </Text>
                    {service.description ? (
                      <Text fontSize="14px" color="#6b6b6b" mt={1}>
                        {service.description}
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
                        onClick={() => onEdit(service.id)}
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
                          setDeleteTarget(service)
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
        title="New service"
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
              onClick={() => void createService()}
            >
              {creating ? "Creating…" : "Create service"}
            </Button>
          </>
        }
      >
        <Box display="flex" flexDirection="column" gap={3}>
          <ModalImageField
            label="Service image"
            preview={coverPreview}
            disabled={creating}
            onPick={setCoverFile}
            onError={setFormError}
          />
          <FieldInput
            value={name}
            aria-label="New service name"
            placeholder="Service name"
            disabled={creating}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                void createService()
              }
            }}
          />
          <FieldInput
            value={description}
            aria-label="New service description"
            placeholder="Description"
            disabled={creating}
            onChange={(event) => setDescription(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                void createService()
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
        title="Delete service?"
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
              Delete service
            </Button>
          </>
        }
      >
        <Text fontSize="15px" color="#6b6b6b" lineHeight="1.5">
          {deleteTarget
            ? `This will permanently remove "${deleteTarget.title}" from the database, including its gallery and uploaded images.`
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
        message="Creating service…"
      />

      <ProcessingOverlay
        open={deleting}
        message="Deleting service…"
        allowCancel
        onCancel={() => deleteAbortRef.current?.abort()}
      />
    </Box>
  )
}
