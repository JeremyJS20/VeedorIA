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

export interface DirectoryCatalogItem {
  key: string
  nombre: string
  identificador: string
  institution_id: number | null
  supplier_rpe: string | null
}

export function useDirectorySearch(tipo: string, q: string, enabled = true) {
  return useQuery({
    queryKey: ["directory-search", tipo, q],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: DirectoryCatalogItem[] }>(
        "/tenants/directory-search",
        { params: { tipo, q } },
      )
      return data.data
    },
    enabled,
  })
}

export function useCreateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      codigo?: string
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
export interface InvitationInfo {
  codigo: string
  nombre: string
  tipo: string
  tipo_etiqueta: string
  plan_tier: string
  plan_etiqueta: string
  alcance: string
  rol_asignado: string
  estado: string
}

export interface PublicSupplierItem {
  rpe: string
  nombre: string
  rnc: string | null
  clasificacion: string
  total_contratos: number
  monto_total: number
}

export interface RegisterAccountPayload {
  modo: "INVITATION" | "NEW_COMPANY"
  codigo_invitacion?: string | null
  nombre: string
  correo: string
  cargo?: string
  password: string
  empresa_nombre?: string | null
  empresa_rpe?: string | null
  empresa_rnc?: string | null
  plan_tier?: "B2B_PYME" | "B2B_CORPORATE"
}

export interface DashboardKpiItem {
  id: string
  label: string
  value: string
  sublabel: string
  tone: "primary" | "warning" | "danger" | "neutral"
  locked: boolean
  required_plan_label?: string
}

export interface DashboardTableRow {
  id: string
  process_code: string
  title: string
  secondary_label: string
  amount_dop: number
  status_badge: string
  status_tone: "critical" | "warning" | "low"
  detail_badge: string
  date_label: string
  locked: boolean
  required_plan_label?: string | null
}

export interface DashboardOverviewData {
  variant: "B2G" | "B2B" | "ADMIN"
  scope_label: string
  plan_tier: string
  plan_label: string
  kpis: DashboardKpiItem[]
  table_title: string
  table_subtitle: string
  rows: DashboardTableRow[]
}

export interface MarketFamilyItem {
  code: string
  label: string
  total_contracts: number
  total_items: number
  total_amount_dop: number
}

export interface MarketPriceTrendPoint {
  period: string
  avg_unit_price: number
  contracts_count: number
}

export interface MarketSupplierShareItem {
  rpe: string
  supplier_name: string
  contracts_won: number
  amount_dop: number
  share_pct: number
}

export interface MarketWinningPriceRange {
  locked: boolean
  required_plan_label: string
  min_price_dop: number
  p25_price_dop: number
  median_price_dop: number
  p75_price_dop: number
  max_price_dop: number
  avg_price_dop: number
  unit_label: string
}

export interface MarketTopInstitutionItem {
  institution_id: number
  institution_name: string
  contracts_count: number
  total_amount_dop: number
}

export interface MarketRecentProcessItem {
  process_code: string
  title: string
  institution_name: string
  amount_dop: number
  signed_date: string
  supplier_name: string
}

export interface MarketIntelligenceData {
  selected_family: MarketFamilyItem
  available_families: MarketFamilyItem[]
  plan_tier: string
  plan_label: string
  history_months_limit: number
  price_trend: MarketPriceTrendPoint[]
  supplier_share: {
    locked: boolean
    required_plan_label: string
    items: MarketSupplierShareItem[]
  }
  winning_price_range: MarketWinningPriceRange
  top_institutions: MarketTopInstitutionItem[]
  recent_processes: MarketRecentProcessItem[]
}

export function useInvitationInfo(code: string | null) {
  const clean = (code || "").trim()
  return useQuery({
    queryKey: ["invitation-info", clean],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: InvitationInfo }>(
        `/auth/invitation/${encodeURIComponent(clean)}`,
      )
      return data.data
    },
    enabled: clean.length >= 2,
    retry: false,
  })
}

export function usePublicSuppliersSearch(q: string, enabled = true) {
  return useQuery({
    queryKey: ["public-suppliers-search", q],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PublicSupplierItem[] }>(
        "/auth/suppliers-search",
        { params: { q, limit: 12 } },
      )
      return data.data
    },
    enabled,
  })
}

export function useRegisterAccount() {
  return useMutation({
    mutationFn: async (payload: RegisterAccountPayload) => {
      const { data } = await apiClient.post<{
        success: boolean
        data: {
          access_token: string
          token_type: string
          expires_in: number
          user: AuthUser
        }
      }>("/auth/register", payload)
      return data.data
    },
  })
}

export function useDashboardOverview(viewMode?: string) {
  return useQuery({
    queryKey: ["dashboard-overview", viewMode || "AUTO"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: DashboardOverviewData }>(
        "/dashboard/overview",
        { params: viewMode ? { view_mode: viewMode } : undefined },
      )
      return data.data
    },
  })
}

export function useMarketIntelligence(unspscFamily?: string) {
  return useQuery({
    queryKey: ["market-intelligence", unspscFamily || "DEFAULT"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: MarketIntelligenceData }>(
        "/market/intelligence",
        { params: unspscFamily ? { unspsc_family: unspscFamily } : undefined },
      )
      return data.data
    },
  })
}
