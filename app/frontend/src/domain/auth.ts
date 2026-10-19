export type TenantType = "PLATFORM" | "GOV_OVERSIGHT" | "GOV_INSTITUTION" | "B2B_SUPPLIER"

export type PlanTier =
  | "PLATFORM_GLOBAL"
  | "B2G_BASIC"
  | "B2G_PREMIUM"
  | "B2G_ENTERPRISE"
  | "B2B_PYME"
  | "B2B_CORPORATE"

export interface AuthRoleInfo {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
}

export interface AuthTenantInfo {
  id: number
  codigo: string
  nombre: string
  tipo: TenantType
  plan_tier: PlanTier
  institution_id: number | null
  supplier_rpe: string | null
  max_categorias_unspsc?: number
  estado: "ACTIVO" | "INACTIVO"
  usuarios_count?: number
  created_at?: string | null
}

export interface AuthUser {
  id: number
  nombre: string
  correo: string
  cargo: string
  estado: "ACTIVO" | "INACTIVO"
  intentos_fallidos: number
  bloqueado: boolean
  bloqueado_hasta?: string | null
  ultimo_acceso_at?: string | null
  rol: AuthRoleInfo
  tenant: AuthTenantInfo
  permisos: string[]
  permisos_rol?: string[]
}

export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: AuthUser
}

export interface PermissionItem {
  id: number
  codigo: string
  modulo: string
  plan_minimo: string
  descripcion: string
}

export interface RoleDetailItem {
  id: number
  codigo: string
  nombre: string
  descripcion: string
  es_sistema: boolean
  estado: string
  usuarios_count: number
  permisos: string[]
}

export interface SaasTierSpec {
  codigo: PlanTier
  segmento: string
  nombre: string
  alcance: string
  capacidades: string[]
}

export interface RolesMatrixResponse {
  roles: RoleDetailItem[]
  permisos: PermissionItem[]
  planes_saas: SaasTierSpec[]
}