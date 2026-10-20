/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import apiClient, { AUTH_TOKEN_KEY } from "../../infrastructure/apiClient"
import type { AuthUser, LoginResponse } from "../../domain/auth"

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
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
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(localStorage.getItem(AUTH_TOKEN_KEY)))

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!storedToken) {
      setUser(null)
      setToken(null)
      setIsLoading(false)
      return null
    }
    try {
      const { data } = await apiClient.get<{ success: boolean; data: AuthUser }>("/auth/me")
      setUser(data.data)
      setToken(storedToken)
      return data.data
    } catch {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      setUser(null)
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
        setUser(data.data)
        setToken(storedToken)
      })
      .catch(() => {
        if (!active) return
        localStorage.removeItem(AUTH_TOKEN_KEY)
        setUser(null)
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
      setUser(authUser)
      queryClient.clear()
    },
    [queryClient],
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
      setUser(payload.user)
      queryClient.clear()
      return payload.user
    },
    [queryClient],
  )

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout")
    } catch {
      // ignore network error on logout
    } finally {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      setToken(null)
      setUser(null)
      queryClient.clear()
    }
  }, [queryClient])

  const hasPermission = useCallback(
    (permissionCode: string): boolean => {
      if (!user) return false
      return user.permisos.includes(permissionCode)
    },
    [user],
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: Boolean(user && token),
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