import { Box } from "@chakra-ui/react"

type PageStatusBadgeProps = {
  status: "draft" | "published"
  size?: "sm" | "md"
}

export function PageStatusBadge({ status, size = "sm" }: PageStatusBadgeProps) {
  const label = status === "published" ? "Published" : "Draft"
  const published = status === "published"

  return (
    <Box
      as="span"
      display="inline-block"
      px={2}
      py={1}
      borderRadius="10px"
      bg={published ? "#f8f1df" : "#eef0f3"}
      color={published ? "#6b5210" : "#4a5568"}
      fontSize={size === "md" ? "14px" : "12px"}
      fontWeight="700"
      lineHeight="1.2"
    >
      {label}
    </Box>
  )
}
