import {
  Portal,
  Stack,
  Toast,
  Toaster as ChakraToaster,
  createToaster,
} from "@chakra-ui/react"

export const toaster = createToaster({
  placement: "top-end",
  overlap: true,
  gap: 12,
})

export function AppToaster() {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
        {(toast) => (
          <Toast.Root width={{ md: "sm" }} borderRadius="10px">
            <Toast.Indicator />
            <Stack gap="1" flex="1" maxWidth="100%">
              {toast.title ? <Toast.Title>{toast.title}</Toast.Title> : null}
              {toast.description ? (
                <Toast.Description>{toast.description}</Toast.Description>
              ) : null}
            </Stack>
            <Toast.CloseTrigger />
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  )
}
