"use client"

import { ChakraProvider } from "@chakra-ui/react"
import { civilmercSystem } from "@/theme/civilmerc-theme"
import {
  ColorModeProvider,
  type ColorModeProviderProps,
} from "./color-mode"
import { AppToaster } from "./toaster"

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={civilmercSystem}>
      <ColorModeProvider {...props} />
      <AppToaster />
    </ChakraProvider>
  )
}
