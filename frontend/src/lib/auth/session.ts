export const AUTH_SESSION_COOKIE = "echo_session_expires_at"
export const ACCESS_TOKEN_COOKIE = "echo_access_token"
export const ACCESS_TOKEN_STORAGE_KEY = "echo_access_token"
export const REFRESH_TOKEN_STORAGE_KEY = "echo_refresh_token"

const SESSION_DAYS = 7
const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60

export type TokenPair = {
  accessToken: string
  refreshToken: string
}

export function isSessionExpiryValid(value: string | undefined): boolean {
  if (!value) {
    return false
  }

  const expiresAt = Number(value)
  return Number.isFinite(expiresAt) && expiresAt > Date.now()
}

export function persistSession(tokens: TokenPair) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000

  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokens.accessToken)
  window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken)
  document.cookie = `${AUTH_SESSION_COOKIE}=${expiresAt}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${tokens.accessToken}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`
}

export function clearSession() {
  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
  document.cookie = `${AUTH_SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax`
}
