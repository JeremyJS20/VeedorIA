/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useQueryClient } from "@tanstack/react-query"
import apiClient, { AUTH_TOKEN_KEY } from "../../infrastructure/apiClient"
import type { AuthUser, LoginResponse } from "../../domain/auth"
import {
  buildPreviewUser,
  findPreviewProfile,
  type PreviewProfile,
} from "../../domain/previewProfiles"

const PREVIEW_KEY = "veedoria_preview_role"

interface AuthContextValue {
  /** Usuario efectivo: si hay vista previa activa, es el perfil simulado. */
  user: AuthUser | null
  /** Usuario real autenticado (nunca simulado). */
  realUser: AuthUser | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  /** Perfil de vista previa activo (solo PLATFORM_ADMIN). */
  previewProfile: PreviewProfile | null
  isPreviewing: boolean
  setPreviewCode: (code: string | null) => void
  login: (correo: string, password: string) => Promise<AuthUser>
  setSession: (accessToken: string, authUser: AuthUser) => void
  logout: () => Promise<void>
  refreshUser: () => Promise<AuthUser | null>
  hasPermission: (permissionCode: string) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY))
  const [realUser, setRealUser] = useState<AuthUser | null>(null)
  const [previewCode, setPreviewCodeState] = useState<string | null>(() =>
    localStorage.getItem(PREVIEW_KEY)
  )
  const [isLoading, setIsLoading] = useState<boolean>(() =>
    Boolean(localStorage.getItem(AUTH_TOKEN_KEY))
  )

  const setPreviewCode = useCallback((code: string | null) => {
    if (code) {
      localStorage.setItem(PREVIEW_KEY, code)
    } else {
      localStorage.removeItem(PREVIEW_KEY)
    }
    setPreviewCodeState(code)
  }, [])

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!storedToken) {
      setRealUser(null)
      setToken(null)
      setIsLoading(false)
      return null
    }
    try {
      const { data } = await apiClient.get<{ success: boolean; data: AuthUser }>("/auth/me")
      setRealUser(data.data)
      setToken(storedToken)
      return data.data
    } catch {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      setRealUser(null)
      setToken(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!storedToken) return
    let active = true
    apiClient
      .get<{ success: boolean; data: AuthUser }>("/auth/me")
      .then(({ data }) => {
        if (!active) return
        setRealUser(data.data)
        setToken(storedToken)
      })
      .catch(() => {
        if (!active) return
        localStorage.removeItem(AUTH_TOKEN_KEY)
        setRealUser(null)
        setToken(null)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const setSession = useCallback(
    (accessToken: string, authUser: AuthUser) => {
      localStorage.setItem(AUTH_TOKEN_KEY, accessToken)
      setToken(accessToken)
      setRealUser(authUser)
      setPreviewCode(null)
      queryClient.clear()
    },
    [queryClient, setPreviewCode]
  )

  const login = useCallback(
    async (correo: string, password: string): Promise<AuthUser> => {
      const { data } = await apiClient.post<{ success: boolean; data: LoginResponse }>("/auth/login", {
        correo,
        password,
      })
      const payload = data.data
      localStorage.setItem(AUTH_TOKEN_KEY, payload.access_token)
      setToken(payload.access_token)
      setRealUser(payload.user)
      setPreviewCode(null)
      queryClient.clear()
      return payload.user
    },
    [queryClient, setPreviewCode]
  )

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout")
    } catch {
      // ignore network error on logout
    } finally {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(PREVIEW_KEY)
      setPreviewCodeState(null)
      setToken(null)
      setRealUser(null)
      queryClient.clear()
    }
  }, [queryClient])

  const previewProfile = useMemo(() => {
    if (realUser?.rol?.codigo !== "PLATFORM_ADMIN") return null
    return findPreviewProfile(previewCode)
  }, [realUser, previewCode])

  const user = useMemo(() => {
    if (!realUser) return null
    if (!previewProfile) return realUser
    return buildPreviewUser(realUser, previewProfile)
  }, [realUser, previewProfile])

  const hasPermission = useCallback(
    (permissionCode: string): boolean => {
      if (!user) return false
      return user.permisos.includes(permissionCode)
    },
    [user]
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        realUser,
        token,
        isLoading,
        isAuthenticated: Boolean(user && token),
        previewProfile,
        isPreviewing: Boolean(previewProfile),
        setPreviewCode,
        login,
        setSession,
        logout,
        refreshUser,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth debe utilizarse dentro de un AuthProvider")
  }
  return ctx
}
