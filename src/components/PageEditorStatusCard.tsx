import { Box, Button, Text } from "@chakra-ui/react"
import { PageStatusBadge } from "@/components/PageStatusBadge"
import { primaryActionButton } from "@/theme/civilmerc-theme"

const dimOnPress = {
  _hover: { opacity: 0.75 },
  _active: { opacity: 0.6 },
} as const

type PageEditorStatusCardProps = {
  status: "draft" | "published"
  pageDirty: boolean
  busy: boolean
  pageError: string
  onPublish: () => void
  onSave: () => void
}

export function PageEditorStatusCard({
  status,
  pageDirty,
  busy,
  pageError,
  onPublish,
  onSave,
}: PageEditorStatusCardProps) {
  const publishDisabled = busy || (status === "published" && !pageDirty)

  return (
    <Box bg="white" borderWidth="1px" borderColor="#e6e6e6" borderRadius="10px" p={4}>
      <Text fontSize="12px" fontWeight="700" letterSpacing="0.08em" color="#6b6b6b" mb={3}>
        STATUS
      </Text>
      <Box mb={3}>
        <PageStatusBadge status={status} size="md" />
      </Box>
      <Button
        w="full"
        h="35px"
        mb={2}
        borderRadius="10px"
        disabled={publishDisabled}
        {...primaryActionButton}
        onClick={onPublish}
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
        onClick={onSave}
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
}
