import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Lock,
  ArrowLeftRight,
  ArrowUpRight,
  Building2,
} from "lucide-react"
import { useCollusionNetwork } from "../hooks/useAuditorB2G"
import { SupplierInspectorDrawer } from "../components/ConsoleInspectorDrawers"

function formatCompactDop(amount: number): string {
  const v = amount || 0
  if (v >= 1_000_000_000) return `RD$ ${(v / 1_000_000_000).toFixed(2)}B`
  if (v >= 1_000_000) return `RD$ ${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `RD$ ${(v / 1_000).toFixed(1)}K`
  return `RD$ ${v.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`
}

export default function CollusionNetworkPage() {
  const navigate = useNavigate()
  const [selectedRpe, setSelectedRpe] = useState<string | null>(null)
  const { data, isLoading } = useCollusionNetwork()

  if (isLoading) {
    return (
      <div className="p-6 sm:p-8 max-w-[80rem] mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">
            Red de Colusión y Concurrencia Relacional
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Analizando relaciones de co-participación recurrente y concentración de adjudicatarios...
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-28 rounded-2xl bg-surface-container-low animate-pulse border border-outline-variant/25"
            />
          ))}
        </div>
      </div>
    )
  }

  if (data?.locked) {
    return (
      <div className="p-6 sm:p-8 max-w-[80rem] mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">
            Red de Colusión y Concurrencia Relacional
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Detección de patrones de rotación, alternancia y concurrencia simultánea entre oferentes.
          </p>
        </div>

        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-amber-500 rounded-2xl p-8 shadow-xs space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-on-surface">
                Módulo Reservado para Suscripción Institucional Avanzada o Contraloría
              </h2>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Su organización opera bajo el plan básico institucional. El análisis relacional de redes de colusión, detección de consorcios cruzados y alertas de rotación de adjudicatarios requiere habilitar el plan{" "}
                <strong className="text-on-surface">Institucional Avanzado (B2G_PREMIUM)</strong> o{" "}
                <strong className="text-on-surface">Contraloría Nacional (B2G_ENTERPRISE)</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
              <p className="text-xs font-bold text-on-surface">Pares de Concurrencia</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Identifica oferentes que participan reiteradamente en los mismos lotes o procesos.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
              <p className="text-xs font-bold text-on-surface">Rotación de Adjudicaciones</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Detecta esquemas de alternancia periódica de contratos dentro de una misma entidad.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
              <p className="text-xs font-bold text-on-surface">Concentración Atípica</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Evalúa el peso acumulado de adjudicaciones por proveedor frente al total del organismo.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const kpis = data?.kpis || {
    clusters_detected: 0,
    suppliers_flagged: 0,
    collusion_anomalies_count: 0,
    exposed_amount: 0,
  }
  const pairs = data?.pairs || []
  const recurrent = data?.recurrent_suppliers || []
  const maxSupplierAmount = Math.max(...recurrent.map((r) => r.total_amount), 1)

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 sm:p-8 max-w-[80rem] mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">
            Red de Colusión y Concurrencia Relacional
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Análisis de co-participación recurrente, rotación de adjudicaciones y concentración por proveedor.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/app/bandeja")}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-95 transition-opacity shadow-xs shrink-0 cursor-pointer"
        >
          <span>Auditar Alertas Relacionales</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* 4 KPI Cards matching OverviewDashboardPage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-primary rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Vínculos Detectados
          </span>
          <div className="mt-2.5 space-y-1">
            <p className="font-mono text-2xl font-bold text-on-surface tracking-tight">
              {kpis.clusters_detected}
            </p>
            <p className="text-xs text-on-surface-variant">
              Pares de proveedores con concurrencia
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-outline-variant rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Proveedores en Observación
          </span>
          <div className="mt-2.5 space-y-1">
            <p className="font-mono text-2xl font-bold text-on-surface tracking-tight">
              {kpis.suppliers_flagged}
            </p>
            <p className="text-xs text-on-surface-variant">
              Adjudicatarios de alta recurrencia
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-red-600 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Alertas de Coordinación
          </span>
          <div className="mt-2.5 space-y-1">
            <p className="font-mono text-2xl font-bold text-red-600 dark:text-red-400 tracking-tight">
              {kpis.collusion_anomalies_count}
            </p>
            <p className="text-xs text-on-surface-variant">
              Señales preventivas por patrón relacional
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-amber-500 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Exposición Asociada
          </span>
          <div className="mt-2.5 space-y-1">
            <p className="font-mono text-2xl font-bold text-primary tracking-tight">
              {formatCompactDop(kpis.exposed_amount)}
            </p>
            <p className="text-xs text-on-surface-variant">
              Volumen contractual en vínculos observados
            </p>
          </div>
        </div>
      </div>

      {/* Two-Column Analytical Layout matching MarketIntelligencePage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Pares de Oferentes */}
        <div className="lg:col-span-7 bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-6 space-y-5 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold text-on-surface">
                Pares de Oferentes con Concurrencia o Alternancia
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Relaciones identificadas por adjudicaciones compartidas o rotación en la misma entidad
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-surface-container-high text-xs font-mono font-semibold text-on-surface shrink-0">
              {pairs.length} vínculos
            </span>
          </div>

          {pairs.length === 0 ? (
            <div className="py-12 text-center text-xs text-on-surface-variant">
              No se registran pares con patrones de colusión en el alcance actual.
            </div>
          ) : (
            <div className="space-y-3">
              {pairs.map((pair, idx) => {
                const riskPct = Math.round(pair.risk_score * 100)
                return (
                  <div
                    key={`${pair.supplier_a}-${pair.supplier_b}-${idx}`}
                    className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/30 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-medium text-on-surface truncate">
                          {pair.institution_name}
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold border ${
                          riskPct >= 75
                            ? "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/25"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25"
                        }`}
                      >
                        Índice {riskPct}%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-2.5 bg-surface px-3.5 py-2.5 rounded-xl border border-outline-variant/25">
                      <div className="text-xs font-bold text-on-surface truncate">
                        {pair.supplier_a}
                      </div>
                      <div className="flex items-center justify-center">
                        <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <div className="text-xs font-bold text-on-surface sm:text-right truncate">
                        {pair.supplier_b}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-on-surface-variant">
                      <span>{pair.pattern_label}</span>
                      <span className="font-mono">
                        <strong className="text-on-surface">{pair.shared_processes_count}</strong> proc. ·{" "}
                        <strong className="text-primary">{formatCompactDop(pair.combined_amount)}</strong>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: Concentración por Proveedor (Progress Bars like MarketIntelligencePage) */}
        <div className="lg:col-span-5 bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-6 space-y-5 shadow-xs">
          <div>
            <h2 className="font-display text-base font-bold text-on-surface">
              Concentración por Proveedor
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Adjudicatarios con mayor recurrencia y volumen contratado
            </p>
          </div>

          <div className="space-y-4">
            {recurrent.slice(0, 8).map((sup, i) => {
              const pct = Math.max(10, Math.round((sup.total_amount / maxSupplierAmount) * 100))
              return (
                <div key={`${sup.supplier_name}-${i}`} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-on-surface truncate">
                      {sup.supplier_name}
                    </span>
                    <span className="font-mono text-on-surface-variant shrink-0">
                      <strong className="text-on-surface">{formatCompactDop(sup.total_amount)}</strong> ·{" "}
                      {sup.processes_count} proc.
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Full Table of Recurrent Suppliers */}
      <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/25">
          <h2 className="font-display text-base font-bold text-on-surface">
            Detalle de Proveedores con Mayor Recurrencia Institucional
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Adjudicatarios ordenados por frecuencia de participación y monto acumulado
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/25 bg-surface-container-low/60 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="py-3 px-5">Proveedor Adjudicatario</th>
                <th className="py-3 px-5">Registro RPE</th>
                <th className="py-3 px-5">Organismo Principal</th>
                <th className="py-3 px-5 text-center">Procesos</th>
                <th className="py-3 px-5 text-center">Contratos</th>
                <th className="py-3 px-5 text-right">Monto Acumulado</th>
                <th className="py-3 px-5 text-right">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-xs">
              {recurrent.map((sup, i) => (
                <tr
                  key={`${sup.supplier_name}-${i}`}
                  className="hover:bg-surface-container-low/50 transition-colors"
                >
                  <td className="py-3.5 px-5 font-semibold text-on-surface">{sup.supplier_name}</td>
                  <td className="py-3.5 px-5 font-mono text-on-surface-variant">{sup.rpe}</td>
                  <td className="py-3.5 px-5 text-on-surface-variant">{sup.institution_name}</td>
                  <td className="py-3.5 px-5 text-center font-mono font-bold text-on-surface">
                    {sup.processes_count}
                  </td>
                  <td className="py-3.5 px-5 text-center font-mono text-on-surface-variant">
                    {sup.contracts_count}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono font-bold text-on-surface">
                    RD$ {sup.total_amount.toLocaleString("es-DO", { maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    {sup.rpe && sup.rpe !== "S/R" ? (
                      <button
                        type="button"
                        onClick={() => setSelectedRpe(sup.rpe)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-primary/10 text-primary border border-outline-variant/35 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <span>Ver Perfil</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-on-surface-variant">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </div>
      </div>

      {selectedRpe && (
        <SupplierInspectorDrawer
          rpe={selectedRpe}
          onClose={() => setSelectedRpe(null)}
        />
      )}
    </div>
  )
}
