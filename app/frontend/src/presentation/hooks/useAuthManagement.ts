import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "../../infrastructure/apiClient"
import type { AuthUser, AuthTenantInfo, RolesMatrixResponse } from "../../domain/auth"

export function useUsersList() {
  return useQuery({
    queryKey: ["auth-users"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: AuthUser[] }>("/usuarios")
      return data.data
    },
  })
}

export function useTenantsList() {
  return useQuery({
    queryKey: ["auth-tenants"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: AuthTenantInfo[] }>("/tenants")
      return data.data
    },
  })
}

export function useRolesMatrix() {
  return useQuery({
    queryKey: ["auth-roles-matrix"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: RolesMatrixResponse }>("/roles")
      return data.data
    },
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      nombre: string
      correo: string
      password: string
      role_id: number
      tenant_id: number
      cargo?: string
    }) => {
      const { data } = await apiClient.post<{ success: boolean; data: AuthUser }>("/usuarios", payload)
      return data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["auth-users"] })
      void qc.invalidateQueries({ queryKey: ["auth-tenants"] })
      void qc.invalidateQueries({ queryKey: ["auth-roles-matrix"] })
    },
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      userId,
      payload,
    }: {
      userId: number
      payload: {
        nombre?: string
        role_id?: number
        tenant_id?: number
        cargo?: string
        estado?: "ACTIVO" | "INACTIVO"
      }
    }) => {
      const { data } = await apiClient.put<{ success: boolean; data: AuthUser }>(`/usuarios/${userId}`, payload)
      return data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["auth-users"] })
      void qc.invalidateQueries({ queryKey: ["auth-tenants"] })
    },
  })
}

export function useUnlockUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: number) => {
      const { data } = await apiClient.post<{ success: boolean; data: AuthUser }>(`/usuarios/${userId}/unlock`)
      return data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["auth-users"] })
    },
  })
}

export function useGenerateResetLink() {
  return useMutation({
    mutationFn: async (userId: number) => {
      const { data } = await apiClient.post<{
        success: boolean
        data: { user_id: number; correo: string; reset_url: string; expira_en_minutos: number }
      }>(`/usuarios/${userId}/reset-link`)
      return data.data
    },
  })
}

export function useCreateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      codigo: string
      nombre: string
      tipo: string
      plan_tier: string
      institution_id?: number | null
      supplier_rpe?: string | null
    }) => {
      const { data } = await apiClient.post<{ success: boolean; data: AuthTenantInfo }>("/tenants", payload)
      return data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["auth-tenants"] })
    },
  })
}

export function useUpdateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      tenantId,
      payload,
    }: {
      tenantId: number
      payload: {
        nombre?: string
        plan_tier?: string
        institution_id?: number | null
        supplier_rpe?: string | null
        estado?: "ACTIVO" | "INACTIVO"
      }
    }) => {
      const { data } = await apiClient.put<{ success: boolean; data: AuthTenantInfo }>(`/tenants/${tenantId}`, payload)
      return data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["auth-tenants"] })
      void qc.invalidateQueries({ queryKey: ["auth-users"] })
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload: {
      password_actual: string
      nueva_password: string
      confirmar_password: string
    }) => {
      const { data } = await apiClient.put<{ success: boolean; data: { message: string } }>(
        "/auth/change-password",
        payload,
      )
      return data.data
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (correo: string) => {
      const { data } = await apiClient.post<{
        success: boolean
        data: { message: string; reset_url_preview?: string | null }
      }>("/auth/forgot-password", { correo })
      return data.data
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (payload: {
      token: string
      nueva_password: string
      confirmar_password: string
    }) => {
      const { data } = await apiClient.post<{ success: boolean; data: { message: string } }>(
        "/auth/reset-password",
        payload,
      )
      return data.data
    },
  })
}