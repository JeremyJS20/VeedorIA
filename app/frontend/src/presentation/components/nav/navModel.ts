import {
  LayoutDashboard,
  TrendingUp,
  Bell,
  Share2,
  FolderKanban,
  SlidersHorizontal,
  CheckCircle2,
  FileBarChart,
  KeyRound,
  Users,
  ShieldCheck,
  Compass,
  Briefcase,
  Calculator,
  Layers,
  CreditCard,
  RefreshCw,
  ScrollText,
  LifeBuoy,
  Gauge,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NavSubLink {
  /** Valor de `?seccion=` que activa la sub-vista. */
  id: string
  label: string
}

/**
 * Un grupo del sidebar puede contener enlaces, acordeones y sub-encabezados.
 * El sub-encabezado existe para reflejar agrupaciones internas sin abrir otra
 * sección con el mismo peso visual.
 */
export type NavEntry =
  | { kind: "heading"; label: string }
  | { kind: "link"; to: string; label: string; icon: LucideIcon }
  | {
      kind: "accordion"
      id: string
      label: string
      icon: LucideIcon
      /** Ruta base a la que navega el encabezado del acordeón. */
      basePath: string
      /** Sub-vista que se abre al entrar desde el encabezado. */
      defaultSection: string
      items: NavSubLink[]
    }

export interface NavGroup {
  id: string
  /** Vacío = grupo sin encabezado (el ítem se muestra suelto arriba de todo). */
  title: string
  entries: NavEntry[]
}

export interface NavContext {
  tenantType?: string
  roleCode?: string
  hasPermission: (code: string) => boolean
}

/** Rutas que no viven en el sidebar pero sí necesitan título de migaja. */
export const EXTRA_PAGE_TITLES: Record<string, string> = {
  "/app/perfil": "Mi Perfil Institucional",
  "/app/competidor": "Ficha Forense de Competidor",
}

/**
 * Construye la navegación lateral agrupada por superficie de producto, no por
 * orden de creación. El orden es: panorama → veeduría → mercado → comercial →
 * cumplimiento → operación → configuración → gestión.
 *
 * Reglas de visibilidad (idénticas a las del layout original):
 * - `isB2GOrPlatform` habilita las superficies de veeduría y compliance.
 * - `canCommercial` habilita la suite B2B (incluye oversight y admin general).
 * - `canAnalytics` añade la inteligencia de mercado cuando existe el permiso.
 * - `isPlatformAdmin` habilita la operación y la gobernanza de plataforma.
 */
export function buildNavGroups({ tenantType, roleCode, hasPermission }: NavContext): NavGroup[] {
  const isPlatformAdmin = roleCode === "PLATFORM_ADMIN"
  const isB2GOrPlatform =
    tenantType === "GOV_INSTITUTION" ||
    tenantType === "GOV_OVERSIGHT" ||
    tenantType === "PLATFORM" ||
    isPlatformAdmin
  const canCommercial =
    tenantType === "B2B_SUPPLIER" || tenantType === "GOV_OVERSIGHT" || isPlatformAdmin
  const canAnalytics = canCommercial && hasPermission("B2B_ANALYTICS")

  const groups: NavGroup[] = []

  // Panorama va sin encabezado: es el punto de entrada de todos los roles y un
  // título de sección encima suyo rotularía mal a los tenants B2B.
  groups.push({
    id: "panorama",
    title: "",
    entries: [
      { kind: "link", to: "/app/dashboard", label: "Panorama Ejecutivo", icon: LayoutDashboard },
    ],
  })

  if (isB2GOrPlatform) {
    groups.push({
      id: "veeduria",
      title: "Veeduría y Hallazgos",
      entries: [
        { kind: "link", to: "/app/bandeja", label: "Bandeja de Anomalías", icon: Bell },
        { kind: "link", to: "/app/procesos", label: "Procesos Institucionales", icon: FolderKanban },
        { kind: "link", to: "/app/red-colusion", label: "Red de Colusión", icon: Share2 },
      ],
    })
  }

  if (canCommercial) {
    const mercado: NavEntry[] = []

    if (canAnalytics) {
      mercado.push({
        kind: "accordion",
        id: "mercado",
        label: "Inteligencia de Mercado",
        icon: TrendingUp,
        basePath: "/app/mercado",
        defaultSection: "precios",
        items: [
          { id: "precios", label: "Precios e Histórico" },
          { id: "competidores", label: "Competidores y Compradores" },
          { id: "procesos", label: "Adjudicaciones del Sector" },
        ],
      })
    }

    mercado.push({
      kind: "link",
      to: "/app/sectores",
      label: "Sectores Monitoreados",
      icon: Layers,
    })

    groups.push({ id: "mercado", title: "Mercado y Rubros", entries: mercado })

    groups.push({
      id: "comercial",
      title: "Operación Comercial B2B",
      entries: [
        { kind: "link", to: "/app/oportunidades", label: "Radar de Oportunidades", icon: Compass },
        { kind: "link", to: "/app/mis-licitaciones", label: "Mis Licitaciones", icon: Briefcase },
        {
          kind: "link",
          to: "/app/simulador-precios",
          label: "Simulador de Precios",
          icon: Calculator,
        },
        { kind: "link", to: "/app/suscripcion", label: "Plan y Suscripción", icon: CreditCard },
      ],
    })
  }

  if (isB2GOrPlatform) {
    groups.push({
      id: "cumplimiento",
      title: "Cumplimiento y Salidas",
      entries: [
        {
          kind: "link",
          to: "/app/resoluciones",
          label: "Historial de Resoluciones",
          icon: CheckCircle2,
        },
        {
          kind: "link",
          to: "/app/reportes",
          label: "Reportes de Cumplimiento",
          icon: FileBarChart,
        },
      ],
    })
  }

  if (isPlatformAdmin) {
    groups.push({
      id: "operacion",
      title: "Operación",
      entries: [
        { kind: "link", to: "/app/sincronizacion", label: "Sincronización DGCP", icon: RefreshCw },
        { kind: "link", to: "/app/calibracion", label: "Ajuste del Motor (escritura)", icon: Gauge },
        { kind: "link", to: "/app/bitacora", label: "Bitácora del Sistema", icon: ScrollText },
        { kind: "link", to: "/app/soporte", label: "Centro de Soporte", icon: LifeBuoy },
      ],
    })
  }

  if (isB2GOrPlatform) {
    groups.push({
      id: "configuracion",
      title: "Configuración y Datos",
      entries: [
        {
          kind: "link",
          to: "/app/configuracion-deteccion",
          label: "Parámetros y Topes (consulta)",
          icon: SlidersHorizontal,
        },
        { kind: "link", to: "/app/integraciones", label: "Integraciones y API", icon: KeyRound },
      ],
    })
  }

  const gestion: NavEntry[] = []

  if (hasPermission("USER_ADMIN")) {
    if (isPlatformAdmin) {
      gestion.push({
        kind: "accordion",
        id: "usuarios",
        label: "Usuarios y Organizaciones",
        icon: Users,
        basePath: "/app/usuarios",
        defaultSection: "usuarios",
        items: [
          { id: "usuarios", label: "Usuarios Registrados" },
          { id: "organizaciones", label: "Organizaciones Suscriptoras" },
        ],
      })
    } else {
      gestion.push({ kind: "link", to: "/app/usuarios", label: "Usuarios y Equipo", icon: Users })
    }
  }

  if (isPlatformAdmin) {
    gestion.push({
      kind: "accordion",
      id: "roles",
      label: "Roles y Planes",
      icon: ShieldCheck,
      basePath: "/app/roles",
      defaultSection: "roles",
      items: [
        { id: "roles", label: "Roles y Autorizaciones" },
        { id: "planes", label: "Planes de Servicio" },
      ],
    })
  }

  if (gestion.length > 0) {
    groups.push({ id: "gestion", title: "Gestión", entries: gestion })
  }

  return groups
}

/**
 * Deriva los títulos de la migaja desde la propia navegación: el ítem del
 * sidebar y el breadcrumb no pueden volver a decir cosas distintas.
 */
export function buildPageTitles(groups: NavGroup[]): Record<string, string> {
  const titles: Record<string, string> = { ...EXTRA_PAGE_TITLES }

  for (const group of groups) {
    for (const entry of group.entries) {
      if (entry.kind === "link") titles[entry.to] = entry.label
      if (entry.kind === "accordion") titles[entry.basePath] = entry.label
    }
  }

  return titles
}
