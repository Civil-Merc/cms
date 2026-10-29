import { Box, Button, Image, Text } from "@chakra-ui/react"
import { useRef } from "react"
import { LuImagePlus } from "react-icons/lu"

const MAX_IMAGE_BYTES = 2 * 1024 * 1024

const dimOnPress = {
  _hover: { opacity: 0.85 },
  _active: { opacity: 0.7 },
}

type ModalImageFieldProps = {
  label?: string
  preview: string
  disabled?: boolean
  onPick: (file: File) => void
  onError: (message: string) => void
}

export function ModalImageField({
  label = "Service image",
  preview,
  disabled,
  onPick,
  onError,
}: ModalImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      onError("Choose an image file (PNG, JPG, or similar).")
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      onError("Image must be 2 MB or smaller.")
      return
    }
    onError("")
    onPick(file)
  }

  return (
    <Box>
      <Text fontSize="13px" fontWeight="600" mb={2}>
        {label}
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
        borderStyle={preview ? "solid" : "dashed"}
        bg="#fafafa"
        overflow="hidden"
        cursor={disabled ? "not-allowed" : "pointer"}
        opacity={disabled ? 0.6 : 1}
        p={preview ? 0 : 4}
        {...(!disabled ? dimOnPress : {})}
        onClick={() => {
          if (!disabled) inputRef.current?.click()
        }}
      >
        {preview ? (
          <Image src={preview} alt="" w="full" h="160px" objectFit="cover" />
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
              Upload image
            </Text>
            <Text fontSize="13px" color="#6b6b6b" mt={1}>
              PNG or JPG, up to 2 MB
            </Text>
          </>
        )}
      </Box>
      {preview ? (
        <Button
          mt={2}
          h="35px"
          px={3}
          borderRadius="10px"
          variant="outline"
          borderColor="#e6e6e6"
          color="#181818"
          fontSize="13px"
          disabled={disabled}
          _hover={{ opacity: 0.75 }}
          _active={{ opacity: 0.6 }}
          onClick={() => inputRef.current?.click()}
        >
          Replace image
        </Button>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          handleFiles(event.target.files)
          event.target.value = ""
        }}
      />
    </Box>
  )
}
