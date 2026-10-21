import type { AuthUser, PlanTier, TenantType } from "./auth"

export interface PreviewProfile {
  code: string
  label: string
  description: string
  rol: { codigo: string; nombre: string }
  tenant: {
    codigo: string
    nombre: string
    tipo: TenantType
    plan_tier: PlanTier
    institution_id: number | null
    supplier_rpe: string | null
  }
  permisos: string[]
}

/**
 * Perfiles de vista previa para el administrador general.
 *
 * IMPORTANTE: es una vista previa de NAVEGACIÓN Y CAPACIDADES. La sesión y el
 * token siguen siendo del PLATFORM_ADMIN, por lo que los datos que devuelve la
 * API siguen siendo los suyos. Sirve para validar qué rutas y acciones ve cada
 * rol antes de la fase de polish.
 */
export const PREVIEW_PROFILES: PreviewProfile[] = [
  {
    code: "TENANT_ADMIN",
    label: "Administrador de organización",
    description: "Institución pública · plan B2G Premium",
    rol: { codigo: "TENANT_ADMIN", nombre: "Administrador de Organización" },
    tenant: {
      codigo: "MOPC",
      nombre: "Ministerio de Obras Públicas y Comunicaciones",
      tipo: "GOV_INSTITUTION",
      plan_tier: "B2G_PREMIUM",
      institution_id: 5,
      supplier_rpe: null,
    },
    permisos: [
      "ANOMALY_READ",
      "FRAGMENTATION_VIEW",
      "PRICE_AI_VIEW",
      "COLLUSION_VIEW",
      "ANOMALY_REVIEW",
      "PROCESS_READ",
      "DETECTION_RUN",
      "B2B_ANALYTICS",
      "USER_ADMIN",
    ],
  },
  {
    code: "AUDITOR",
    label: "Auditor / órgano rector",
    description: "Supervisión nacional · plan B2G Enterprise",
    rol: { codigo: "AUDITOR", nombre: "Auditor de Contrataciones" },
    tenant: {
      codigo: "DIGEIG",
      nombre: "Dirección General de Ética e Integridad Gubernamental",
      tipo: "GOV_OVERSIGHT",
      plan_tier: "B2G_ENTERPRISE",
      institution_id: null,
      supplier_rpe: null,
    },
    permisos: [
      "ANOMALY_READ",
      "FRAGMENTATION_VIEW",
      "PRICE_AI_VIEW",
      "COLLUSION_VIEW",
      "ANOMALY_REVIEW",
      "PROCESS_READ",
      "DETECTION_RUN",
    ],
  },
  {
    code: "PROVEEDOR",
    label: "Empresa proveedora",
    description: "Sector privado · plan B2B Corporativo",
    rol: { codigo: "PROVEEDOR", nombre: "Proveedor del Estado" },
    tenant: {
      codigo: "CONSTRUCTORA-B2B",
      nombre: "Constructora del Cibao SRL",
      tipo: "B2B_SUPPLIER",
      plan_tier: "B2B_CORPORATE",
      institution_id: null,
      supplier_rpe: "132993",
    },
    permisos: ["ANOMALY_READ", "PROCESS_READ", "B2B_ANALYTICS"],
  },
]

export function findPreviewProfile(code: string | null): PreviewProfile | null {
  if (!code) return null
  return PREVIEW_PROFILES.find((profile) => profile.code === code) ?? null
}

export function buildPreviewUser(realUser: AuthUser, profile: PreviewProfile): AuthUser {  return {
    ...realUser,
    nombre: `Vista previa · ${profile.label}`,
    rol: {
      id: -1,
      codigo: profile.rol.codigo,
      nombre: profile.rol.nombre,
      descripcion: profile.description,
    },
    tenant: {
      id: -1,
      codigo: profile.tenant.codigo,
      nombre: profile.tenant.nombre,
      tipo: profile.tenant.tipo,
      plan_tier: profile.tenant.plan_tier,
      institution_id: profile.tenant.institution_id,
      supplier_rpe: profile.tenant.supplier_rpe,
      estado: "ACTIVO",
    },
    permisos: profile.permisos,
    permisos_rol: profile.permisos,
  }
}

/**
 * Capacidades cuyo candado decide el backend a partir del plan del token.
 * En vista previa el token sigue siendo del administrador, así que el flag del
 * API refleja SU plan; aquí se recalcula con el plan simulado.
 */
export type PlanCapability = "collusion" | "forensic" | "market_advanced"

/** Planes que NO incluyen la capacidad (espejo de la matriz de `security-model.md`). */
const PLANS_WITHOUT_CAPABILITY: Record<PlanCapability, readonly string[]> = {
  // Grafo de colusión completo: bloqueado en el plan institucional básico.
  collusion: ["B2G_BASIC"],
  // Ficha forense de competidor (precios por rubro UNSPSC + flags): bloqueada en PyME.
  forensic: ["B2B_PYME"],
  // Subsecciones avanzadas de inteligencia de mercado: bloqueadas en PyME.
  market_advanced: ["B2B_PYME"],
}

export interface PlanLockContext {
  isPreviewing: boolean
  planTier?: string | null
}

/**
 * Resuelve si una capacidad está bloqueada por plan.
 * Fuera de la vista previa devuelve el flag del backend sin tocarlo.
 */
export function resolvePlanLock(
  lockedFromApi: boolean,
  capability: PlanCapability,
  context: PlanLockContext
): boolean {
  if (!context.isPreviewing) return lockedFromApi
  const tier = context.planTier ?? ""
  if (!tier) return lockedFromApi
  return PLANS_WITHOUT_CAPABILITY[capability].includes(tier)
}
