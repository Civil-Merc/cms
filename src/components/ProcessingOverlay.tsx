import { Box, Button, Image, Portal, Text, VStack } from "@chakra-ui/react"
import smallLogo from "@/assets/small_logo.webp"

type ProcessingOverlayProps = {
  open: boolean
  onCancel?: () => void
  message?: string
  allowCancel?: boolean
}

export function ProcessingOverlay({
  open,
  onCancel,
  message = "Processing, please wait",
  allowCancel = true,
}: ProcessingOverlayProps) {
  if (!open) return null

  return (
    <Portal>
      <Box
        position="fixed"
        inset={0}
        zIndex={9999}
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={6}
        bg="rgba(13, 13, 13, 0.45)"
        style={{ backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
      >
        <VStack gap={6}>
          <Box position="relative" w="134px" h="134px">
            <svg viewBox="0 0 168 168" width="134" height="134" aria-hidden>
              <circle
                cx="84"
                cy="84"
                r="74"
                fill="none"
                stroke="#3a3a3a"
                strokeWidth="7"
              />
              <circle
                cx="84"
                cy="84"
                r="74"
                fill="none"
                stroke="#fdc23e"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray="42 424"
                style={{
                  transformOrigin: "84px 84px",
                  animation: "civilmerc-spin 1.15s linear infinite",
                }}
              />
            </svg>
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              w="102px"
              h="102px"
              borderRadius="full"
              bg="#181818"
              display="flex"
              alignItems="center"
              justifyContent="center"
              overflow="hidden"
            >
              <Image
                src={smallLogo}
                alt=""
                w="58px"
                h="58px"
                objectFit="contain"
              />
            </Box>
          </Box>

          <Text
            color="#f1f1f1"
            fontSize="18px"
            fontWeight="500"
            textAlign="center"
          >
            {message}
          </Text>

          <Button
            type="button"
            onClick={onCancel}
            h="35px"
            px={8}
            borderRadius="10px"
            bg="white"
            color="#181818"
            fontSize="16px"
            fontWeight="600"
            _hover={{ opacity: 0.75 }}
            _active={{ opacity: 0.6 }}
            display={allowCancel && onCancel ? "inline-flex" : "none"}
          >
            Cancel
          </Button>
        </VStack>
      </Box>
    </Portal>
  )
}
