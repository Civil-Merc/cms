import { useCallback, useEffect, useState } from "react"
import { Box } from "@chakra-ui/react"
import { AdminShell } from "@/auth/admin/AdminShell"
import { fetchCurrentUser, login as loginRequest, logout as logoutRequest, setUnauthorizedHandler } from "@/auth/auth-api"
import { clearAccessToken, getAccessToken, setAccessToken } from "@/auth/auth-session"
import { CivilMercCmsLoginPage } from "@/pages/CivilMercCmsLoginPage"

function App() {
  const [booting, setBooting] = useState(true)
  const [signedIn, setSignedIn] = useState(false)

  const signOut = useCallback(() => {
    clearAccessToken()
    setSignedIn(false)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(signOut)
    return () => setUnauthorizedHandler(null)
  }, [signOut])

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      setBooting(false)
      return
    }

    void fetchCurrentUser(token)
      .then(() => setSignedIn(true))
      .catch(() => {
        clearAccessToken()
        setSignedIn(false)
      })
      .finally(() => setBooting(false))
  }, [])

  const handleLogin = async (email: string, password: string) => {
    const { token } = await loginRequest(email, password)
    setAccessToken(token)
    setSignedIn(true)
  }

  const handleSignOut = () => {
    const token = getAccessToken()
    signOut()
    if (token) {
      void logoutRequest(token).catch(() => undefined)
    }
  }

  if (booting) {
    return <Box minH="100dvh" bg="#0d0d0d" />
  }

  if (!signedIn) {
    return <CivilMercCmsLoginPage onLogin={handleLogin} />
  }

  return <AdminShell onSignOut={handleSignOut} />
}

export default App
