export type TenantType = "PLATFORM" | "GOV_OVERSIGHT" | "GOV_INSTITUTION" | "B2B_SUPPLIER"

export type PlanTier =
  | "PLATFORM_GLOBAL"
  | "B2G_BASIC"
  | "B2G_PREMIUM"
  | "B2G_ENTERPRISE"
  | "B2B_PYME"
  | "B2B_CORPORATE"

export const PLAN_LABELS: Record<string, string> = {
  ALL: "Todos los Planes",
  PLATFORM_GLOBAL: "Gobierno de Plataforma",
  B2G_BASIC: "Institucional Básico",
  B2G_PREMIUM: "Institucional Avanzado",
  B2G_ENTERPRISE: "Ente Rector Nacional",
  B2B_PYME: "Proveedor Pyme",
  B2B_CORPORATE: "Proveedor Corporativo",
}

export const TENANT_TYPE_LABELS: Record<string, string> = {
  PLATFORM: "Administración Central",
  GOV_OVERSIGHT: "Órgano Rector",
  GOV_INSTITUTION: "Institución Pública",
  B2B_SUPPLIER: "Empresa Proveedora",
}

export const PERMISSION_LABELS: Record<string, string> = {
  ANOMALY_READ: "Consulta de Hallazgos",
  FRAGMENTATION_VIEW: "Análisis de Fraccionamiento",
  PRICE_AI_VIEW: "Análisis de Sobreprecios",
  COLLUSION_VIEW: "Red de Colusión entre Oferentes",
  ANOMALY_REVIEW: "Emisión de Dictámenes",
  PROCESS_READ: "Consulta de Expedientes",
  DETECTION_RUN: "Ejecución de Auditoría",
  AI_CALIBRATE: "Calibración de Umbrales",
  SYNC_TRIGGER: "Sincronización de Datos DGCP",
  B2B_ANALYTICS: "Inteligencia de Mercado",
  USER_ADMIN: "Administración de Usuarios",
  TENANT_MANAGE: "Gestión de Organizaciones",
  ROLE_VIEW: "Consulta de Roles y Permisos",
}

export function formatPlanLabel(plan: string | undefined | null): string {
  if (!plan) return "Institucional"
  return PLAN_LABELS[plan] || plan
}

export function formatTenantTypeLabel(tipo: string | undefined | null): string {
  if (!tipo) return "Institución"
  return TENANT_TYPE_LABELS[tipo] || tipo
}

export function formatPermissionLabel(code: string): string {
  return PERMISSION_LABELS[code] || code
}

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