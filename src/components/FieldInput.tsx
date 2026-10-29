import { Input, type InputProps } from "@chakra-ui/react"

export const fieldInputProps = {
  h: "45px",
  borderRadius: "10px",
  bg: "#f1f1f1",
  borderColor: "transparent",
  color: "#181818",
  _hover: { borderColor: "transparent" },
  _focusVisible: { borderColor: "transparent", boxShadow: "none", outline: "none", bg: "#f1f1f1" },
} as const

export function FieldInput(props: InputProps) {
  return <Input {...fieldInputProps} {...props} />
}
