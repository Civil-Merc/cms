const ACCESS_TOKEN_KEY = "civilmerc.cms.accessToken"

export function getAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token: string) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function clearAccessToken() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
}
