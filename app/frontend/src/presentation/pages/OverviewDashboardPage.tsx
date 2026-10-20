import { useState } from "react"
import { Link } from "react-router-dom"
import {
  ShieldCheck,
  Building2,
  Briefcase,
  Lock,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Activity,
  FileSpreadsheet,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useDashboardOverview } from "../hooks/useAuthManagement"

function formatCurrencyDop(val: number): string {
  if (!val || val <= 0) return "—"
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0,
  }).format(val)
}

export default function OverviewDashboardPage() {
  const { user } = useAuth()
  const isPlatformAdmin = user?.rol.codigo === "PLATFORM_ADMIN"
  const [previewMode, setPreviewMode] = useState<"ADMIN" | "B2G" | "B2B">("ADMIN")

  const effectiveMode = isPlatformAdmin ? previewMode : undefined
  const { data: overview, isLoading } = useDashboardOverview(effectiveMode)

  const variant = overview?.variant || "B2G"

  const variantMeta = {
    B2G: {
      badge: "Consola de Fiscalización Institucional",
      title: "Panorama Ejecutivo de Auditoría",
      ctaLabel: "Ir a Bandeja de Anomalías",
      ctaLink: "/app/bandeja",
      icon: ShieldCheck,
    },
    B2B: {
      badge: "Consola Comercial de Proveedores del Estado",
      title: "Panorama Competitivo y Oportunidades",
      ctaLabel: "Abrir Inteligencia de Mercado",
      ctaLink: "/app/mercado",
      icon: Briefcase,
    },
    ADMIN: {
      badge: "Gobierno General de Plataforma",
      title: "Panorama Operativo y Sincronización Nacional",
      ctaLabel: "Gestionar Organizaciones y Usuarios",
      ctaLink: "/app/usuarios",
      icon: Building2,
    },
  }[variant]

  const HeaderIcon = variantMeta.icon

  return (
    <div className="w-full max-w-[80rem] mx-auto px-6 py-6 space-y-6">
      {/* Top Header Banner */}
      <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-xs">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <HeaderIcon className="w-3.5 h-3.5" />
            <span>{variantMeta.badge}</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-on-surface">
            {variantMeta.title}
          </h1>
          <p className="text-xs text-on-surface-variant">
            Alcance activo:{" "}
            <span className="font-semibold text-on-surface">
              {overview?.scope_label || user?.tenant.nombre}
            </span>{" "}
            · Suscripción:{" "}
            <span className="font-semibold text-primary">
              {overview?.plan_label || "Plan Activo"}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isPlatformAdmin && (
            <div className="inline-flex items-center bg-surface-container-low dark:bg-surface-container-high p-1 rounded-xl border border-outline-variant/40">
              {[
                { id: "ADMIN" as const, label: "Vista Administración" },
                { id: "B2G" as const, label: "Vista Auditor Institucional" },
                { id: "B2B" as const, label: "Vista Proveedor" },
              ].map((tab) => {
                const active = previewMode === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPreviewMode(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      active
                        ? "bg-primary text-on-primary shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          )}

          <Link
            to={variantMeta.ctaLink}
            className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-95 transition-opacity"
          >
            <span>{variantMeta.ctaLabel}</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-36 rounded-2xl bg-surface-container-low animate-pulse border border-outline-variant/25"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {(overview?.kpis || []).map((kpi) => {
            const toneColors = {
              primary: "text-primary bg-primary/10",
              warning: "text-amber-700 dark:text-amber-300 bg-amber-500/10",
              danger: "text-red-700 dark:text-red-300 bg-red-500/10",
              neutral: "text-on-surface bg-surface-container-high",
            }[kpi.tone]

            return (
              <div
                key={kpi.id}
                className="relative bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-5 flex flex-col justify-between shadow-xs overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    {kpi.label}
                  </span>
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${toneColors}`}>
                    {kpi.locked ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : kpi.tone === "warning" || kpi.tone === "danger" ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <Activity className="w-3.5 h-3.5" />
                    )}
                  </span>
                </div>

                {kpi.locked ? (
                  <div className="mt-3 pt-2 border-t border-outline-variant/25 space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Indicador restringido por plan</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-snug">
                      Disponible en{" "}
                      <span className="font-semibold text-on-surface">
                        {kpi.required_plan_label || "Plan Superior"}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 space-y-1">
                    <p className="font-mono text-2xl font-bold text-on-surface tracking-tight">
                      {kpi.value}
                    </p>
                    <p className="text-xs text-on-surface-variant">{kpi.sublabel}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Central Table Section */}
      <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/25 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-bold text-on-surface flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              <span>{overview?.table_title || "Registros Recientes"}</span>
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {overview?.table_subtitle}
            </p>
          </div>
          <Link
            to={variantMeta.ctaLink}
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            <span>Ver listado completo</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/25 bg-surface-container-low/60 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="py-3 px-5">Código / Referencia</th>
                <th className="py-3 px-5">Descripción del Proceso o Evento</th>
                <th className="py-3 px-5">Entidad / Contraparte</th>
                <th className="py-3 px-5">Clasificación</th>
                <th className="py-3 px-5 text-right">Monto / Volumen</th>
                <th className="py-3 px-5 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-xs">
              {(overview?.rows || []).map((row) => {
                const badgeStyle = {
                  critical:
                    "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/25",
                  warning:
                    "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25",
                  low: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25",
                }[row.status_tone]

                return (
                  <tr
                    key={row.id}
                    className="hover:bg-surface-container-low/50 transition-colors"
                  >
                    <td className="py-3.5 px-5 font-mono font-semibold text-primary whitespace-nowrap">
                      {row.process_code}
                      <div className="text-[11px] font-normal text-on-surface-variant">
                        {row.date_label}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-medium text-on-surface max-w-[340px]">
                      <p className="line-clamp-2">{row.title}</p>
                    </td>
                    <td className="py-3.5 px-5 text-on-surface-variant max-w-[220px] truncate">
                      {row.secondary_label}
                    </td>
                    <td className="py-3.5 px-5">
                      {row.locked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-semibold">
                          <Lock className="w-3 h-3" />
                          <span>{row.required_plan_label || "Plan Avanzado"}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-surface-container-high text-on-surface text-[11px] font-medium">
                          {row.detail_badge}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-semibold text-on-surface whitespace-nowrap">
                      {row.locked ? "Restringido" : formatCurrencyDop(row.amount_dop)}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${badgeStyle}`}
                      >
                        {row.status_tone === "low" && <CheckCircle2 className="w-3 h-3" />}
                        <span>{row.status_badge}</span>
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}