import { Dialog, Portal } from "@chakra-ui/react"
import type { ReactNode } from "react"
import { LuX } from "react-icons/lu"

type CmsDialogProps = {
  open: boolean
  onOpenChange: (details: { open: boolean }) => void
  title: ReactNode
  maxW?: string
  children: ReactNode
  footer?: ReactNode
}

export function CmsDialog({
  open,
  onOpenChange,
  title,
  maxW = "440px",
  children,
  footer,
}: CmsDialogProps) {
  return (
    <Dialog.Root placement="center" open={open} onOpenChange={onOpenChange}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW={maxW} borderRadius="10px" bg="white" color="#181818">
            <Dialog.Header
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              gap={3}
              pb={4}
              borderBottomWidth="1px"
              borderColor="#e6e6e6"
            >
              <Dialog.Title
                flex="1"
                minW={0}
                fontSize="18px"
                fontWeight="700"
                lineHeight="32px"
                m={0}
              >
                {title}
              </Dialog.Title>
              <Dialog.CloseTrigger
                pos="static"
                top="auto"
                insetEnd="auto"
                insetInlineEnd="auto"
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
                h="32px"
                w="32px"
                minW="32px"
                p={0}
                borderRadius="10px"
                color="#181818"
                bg="transparent"
                cursor="pointer"
                aria-label="Close dialog"
                _hover={{ opacity: 0.75 }}
                _active={{ opacity: 0.6 }}
              >
                <LuX size={18} />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>{children}</Dialog.Body>
            {footer ? <Dialog.Footer>{footer}</Dialog.Footer> : null}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
