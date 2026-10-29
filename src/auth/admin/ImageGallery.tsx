import { Box, Button, IconButton, Image, Text } from "@chakra-ui/react"
import { useRef, useState } from "react"
import { LuPlus, LuX } from "react-icons/lu"

export type GalleryImage = {
  id: string
  name: string
  src: string
}

const MAX_IMAGE_BYTES = 2 * 1024 * 1024

type ImageGalleryProps = {
  images: GalleryImage[]
  onChange: (images: GalleryImage[]) => void
  uploadFile?: (file: File) => Promise<GalleryImage>
  onRemove?: (image: GalleryImage) => Promise<void>
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result)
      else reject(new Error("Could not read image"))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function ImageGallery({ images, onChange, uploadFile, onRemove }: ImageGalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [notice, setNotice] = useState("")

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return
    if (uploadFile) setNotice("Uploading…")
    const accepted: GalleryImage[] = []
    const rejected: string[] = []
    let next = images

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        rejected.push(`${file.name} is not an image`)
        continue
      }
      if (file.size > MAX_IMAGE_BYTES) {
        rejected.push(`${file.name} is over 2 MB`)
        continue
      }
      try {
        const image = uploadFile
          ? await uploadFile(file)
          : {
              id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
              name: file.name,
              src: await readFile(file),
            }
        next = [...next, image]
        accepted.push(image)
      } catch (error) {
        rejected.push(error instanceof Error ? error.message : `${file.name} could not be added`)
      }
    }

    if (accepted.length) onChange(next)
    setNotice(
      rejected.length
        ? rejected.join(". ")
        : accepted.length
          ? `${accepted.length} image${accepted.length === 1 ? "" : "s"} added.`
          : "",
    )
  }

  return (
    <Box bg="white" borderWidth="1px" borderColor="#e6e6e6" borderRadius="10px" p={{ base: 4, md: 5 }}>
      <Text fontSize="14px" fontWeight="600" mb={2}>
        Image gallery
      </Text>
      <Text fontSize="13px" color="#6b6b6b" mb={3}>
        Add several images. Each file must be 2 MB or smaller.
      </Text>

      <Box position="relative">
        <Box
          as="button"
          aria-label="Add images to the gallery"
          onClick={() => inputRef.current?.click()}
          w="full"
          textAlign="left"
          cursor="pointer"
          borderWidth="1px"
          borderColor="#e6e6e6"
          borderRadius="10px"
          bg="#fafafa"
          p={4}
          minH="180px"
          _hover={{ opacity: 0.75 }}
          _active={{ opacity: 0.6 }}
          _focusVisible={{ outline: "2px solid #181818", outlineOffset: "2px" }}
        >
          {images.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              gap={2}
              minH="148px"
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                h="35px"
                w="35px"
                borderRadius="full"
                bg="#181818"
                color="white"
              >
                <LuPlus size={16} />
              </Box>
              <Text fontSize="14px" color="#6b6b6b">
                No images yet. Click to add some.
              </Text>
            </Box>
          ) : (
            <Box
              display="grid"
              gridTemplateColumns={{ base: "1fr 1fr", md: "repeat(3, 1fr)" }}
              gap={3}
            >
              {images.map((image) => (
                <Image
                  key={image.id}
                  src={image.src}
                  alt=""
                  w="full"
                  h="120px"
                  objectFit="cover"
                  borderRadius="10px"
                  bg="#f1f1f1"
                />
              ))}
            </Box>
          )}
        </Box>

        {images.length > 0 && (
          <Box
            position="absolute"
            inset={0}
            p={4}
            display="grid"
            gridTemplateColumns={{ base: "1fr 1fr", md: "repeat(3, 1fr)" }}
            gap={3}
            pointerEvents="none"
          >
            {images.map((image) => (
              <Box key={image.id} position="relative">
                <IconButton
                  aria-label={`Remove ${image.name}`}
                  position="absolute"
                  top="6px"
                  right="6px"
                  h="35px"
                  minW="35px"
                  pointerEvents="auto"
                  borderRadius="10px"
                  bg="white"
                  color="#181818"
                  _hover={{ opacity: 0.75 }}
                  _active={{ opacity: 0.6 }}
                  onClick={() => {
                    void (async () => {
                      try {
                        if (onRemove) await onRemove(image)
                        onChange(images.filter((item) => item.id !== image.id))
                      } catch (error) {
                        setNotice(error instanceof Error ? error.message : "Could not remove the image.")
                      }
                    })()
                  }}
                >
                  <LuX size={14} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Button
        mt={3}
        h="35px"
        borderRadius="10px"
        variant="outline"
        borderColor="#e6e6e6"
        color="#181818"
        _hover={{ opacity: 0.75 }}
        _active={{ opacity: 0.6 }}
        onClick={() => inputRef.current?.click()}
      >
        <LuPlus size={14} />
        Add images
      </Button>

      {notice && (
        <Text mt={2} fontSize="13px" color="#6b6b6b">
          {notice}
        </Text>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          void addFiles(event.target.files)
          event.target.value = ""
        }}
      />
    </Box>
  )
}
