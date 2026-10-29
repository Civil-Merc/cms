import {
  Box,
  Button,
  Heading,
  Image,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react"
import { type FormEvent, useState } from "react"
import { LuCircleAlert, LuCircleCheck } from "react-icons/lu"
import { ProcessingOverlay } from "@/components/ProcessingOverlay"
import logo from "@/assets/logo.webp"

const inputStyles = {
  bg: "#f1f1f1",
  borderRadius: "10px",
  borderColor: "transparent",
  color: "#181818",
  h: "68px",
  pt: "26px",
  pb: "8px",
  px: "14px",
  fontSize: "18px",
  lineHeight: "1.2",
  _placeholder: { color: "#9a9a9a" },
  _hover: { borderColor: "transparent" },
  _focusVisible: {
    borderColor: "transparent",
    boxShadow: "none",
    outline: "none",
    bg: "#f1f1f1",
  },
} as const

function FieldLabel({ children }: { children: string }) {
  return (
    <Text
      position="absolute"
      top="10px"
      left="14px"
      zIndex={1}
      pointerEvents="none"
      fontSize="12px"
      fontWeight="600"
      lineHeight="1"
      color="#6b6b6b"
    >
      {children}
    </Text>
  )
}

function LoginNotice({
  tone,
  title,
  message,
}: {
  tone: "success" | "error"
  title: string
  message: string
}) {
  const isSuccess = tone === "success"
  const toneColor = isSuccess ? "#6b5210" : "#8f2d2d"
  const Icon = isSuccess ? LuCircleCheck : LuCircleAlert

  return (
    <Box
      role="status"
      w="full"
      borderRadius="10px"
      px={4}
      py={3}
      bg={isSuccess ? "#f8f1df" : "#fdecec"}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <Icon size={18} color={toneColor} aria-hidden />
        <Text fontSize="15px" fontWeight="700" color={toneColor} lineHeight="1.3">
          {title}
        </Text>
      </Box>
      <Text
        mt={1}
        pl="26px"
        fontSize="14px"
        color={isSuccess ? "#5c4a24" : "#6e3a3a"}
        lineHeight="1.4"
      >
        {message}
      </Text>
    </Box>
  )
}

export function CivilMercCmsLoginPage({
  onLogin,
}: {
  onLogin: (email: string, password: string) => Promise<void>
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [processing, setProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage("")
    setProcessing(true)
    try {
      await onLogin(email, password)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not sign in."
      setErrorMessage(message || "Check your email and password, then try again.")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Box
      minH="100dvh"
      bg="#0d0d0d"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      overflowY="auto"
      px={4}
      py={{ base: 8, sm: 10 }}
    >
      <Image
        src={logo}
        alt="CivilMerc"
        h={{ base: "36px", sm: "48px" }}
        w="auto"
        objectFit="contain"
      />
      <Heading
        as="p"
        mt={4}
        mb={{ base: 6, sm: 8 }}
        color="#f1f1f1"
        fontSize={{ base: "22px", sm: "28px" }}
        fontWeight="700"
        letterSpacing="0.02em"
        textAlign="center"
        lineHeight="1.15"
      >
        Content Management System
      </Heading>

      <Box
        w="full"
        maxW="400px"
        bg="white"
        color="#181818"
        borderRadius="10px"
        px={{ base: 5, sm: 8 }}
        py={{ base: 6, sm: 8 }}
        boxShadow="0 12px 40px rgba(0, 0, 0, 0.35)"
      >
        <Heading
          as="h1"
          fontSize={{ base: "26px", sm: "28px" }}
          fontWeight="700"
          letterSpacing="-0.02em"
          mb={1}
        >
          Log in
        </Heading>
        <Text color="#6b6b6b" fontSize="16px" mb={6}>
          Continue to CivilMerc CMS
        </Text>

        <form onSubmit={handleSubmit}>
          <Stack gap={4}>
            {errorMessage ? (
              <LoginNotice tone="error" title="Could not sign in" message={errorMessage} />
            ) : null}

            <Box position="relative">
              <FieldLabel>Email</FieldLabel>
              <Input
                name="email"
                type="email"
                aria-label="Email"
                autoComplete="username"
                placeholder="admin@civilmerc.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={processing}
                {...inputStyles}
              />
            </Box>

            <Box position="relative">
              <FieldLabel>Password</FieldLabel>
              <Input
                name="password"
                type="password"
                aria-label="Password"
                autoComplete="current-password"
                placeholder="****"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={processing}
                {...inputStyles}
              />
            </Box>

            <Button
              type="submit"
              w="full"
              h="47px"
              mt={2}
              borderRadius="10px"
              bg="#181818"
              color="white"
              fontSize="18px"
              fontWeight="600"
              disabled={processing}
              _hover={{ opacity: 0.75 }}
              _active={{ opacity: 0.6 }}
            >
              Sign in
            </Button>
          </Stack>
        </form>
      </Box>

      <Text
        mt={{ base: 8, sm: 10 }}
        fontSize="14px"
        color="#8a8a8a"
        textAlign="center"
        maxW="360px"
      >
        Authorized personnel only. CivilMerc Content Management System.
      </Text>

      <ProcessingOverlay open={processing} allowCancel={false} />
    </Box>
  )
}
