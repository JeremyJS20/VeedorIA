import { useNavigate } from "react-router-dom"
import {
  Share2,
  Users,
  AlertOctagon,
  DollarSign,
  Lock,
  ArrowLeftRight,
  ExternalLink,
  Building2,
} from "lucide-react"
import { useCollusionNetwork } from "../hooks/useAuditorB2G"

function formatDopCompact(val: number): string {
  if (val >= 1_000_000_000) return `RD$ ${(val / 1_000_000_000).toFixed(2)}B`
  if (val >= 1_000_000) return `RD$ ${(val / 1_000_000).toFixed(2)}M`
  if (val >= 1_000) return `RD$ ${(val / 1_000).toFixed(1)}K`
  return `RD$ ${val.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`
}

export default function CollusionNetworkPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useCollusionNetwork()

  if (isLoading) {
    return (
      <div className="p-6 sm:p-8 max-w-[80rem] mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Red de Colusión</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Analizando relaciones de concurrencia y concentración de adjudicatarios...
          </p>
        </div>
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-12 text-center text-sm text-on-surface-variant">
          Procesando grafo relacional de proveedores...
        </div>
      </div>
    )
  }

  if (data?.locked) {
    return (
      <div className="p-6 sm:p-8 max-w-[80rem] mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Red de Colusión</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Detección de patrones de rotación, alternancia y concurrencia simultánea entre oferentes.
          </p>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-8 md:p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-on-surface">
            Módulo Reservado para Suscripción Institucional Pro o Contraloría
          </h2>
          <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
            Su unidad opera actualmente bajo el plan básico institucional. El análisis relacional de redes de colusión, detección de consorcios cruzados y alertas de rotación de adjudicatarios requiere habilitar el nivel <strong>Institucional Pro (B2G_PRO)</strong> o superior.
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-left">
            <div className="p-4 rounded-xl bg-surface border border-outline-variant/30">
              <p className="text-xs font-bold text-on-surface">Pares de Concurrencia</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Identifica oferentes que participan reiteradamente en los mismos lotes o procesos.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-outline-variant/30">
              <p className="text-xs font-bold text-on-surface">Rotación de Adjudicaciones</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Detecta esquemas de alternancia periódica de contratos dentro de una misma entidad.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-outline-variant/30">
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

  return (
    <div className="p-6 sm:p-8 max-w-[80rem] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">Red de Colusión</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Análisis relacional de co-participación recurrente, rotación de adjudicaciones y concentración por proveedor.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Vínculos Detectados
            </span>
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-on-surface">
            {kpis.clusters_detected}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Pares de proveedores con concurrencia reiterada
          </p>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Proveedores en Observación
            </span>
            <div className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-on-surface">
            {kpis.suppliers_flagged}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Adjudicatarios con alta recurrencia institucional
          </p>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Alertas de Coordinación
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {kpis.collusion_anomalies_count}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Señales preventivas por patrón relacional
          </p>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Exposición Asociada
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-on-surface">
            {formatDopCompact(kpis.exposed_amount)}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Volumen contractual en vínculos observados
          </p>
        </div>
      </div>

      {/* Pares Relacionales */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-on-surface">
            Pares de Oferentes con Concurrencia o Alternancia Detectada
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Relaciones identificadas a partir de adjudicaciones compartidas o rotación en procedimientos de la misma unidad compradora.
          </p>
        </div>

        {pairs.length === 0 ? (
          <div className="py-10 text-center text-sm text-on-surface-variant">
            No se registran pares con patrones de colusión en el alcance actual.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pairs.map((pair, idx) => {
              const riskPct = Math.round(pair.risk_score * 100)
              return (
                <div
                  key={`${pair.supplier_a}-${pair.supplier_b}-${idx}`}
                  className="bg-surface border border-outline-variant/30 rounded-xl p-4 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate font-medium">{pair.institution_name}</span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                        riskPct >= 75
                          ? "bg-red-500/15 text-red-600 dark:text-red-400"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      Índice {riskPct}%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-2 bg-surface-container-low p-3 rounded-lg border border-outline-variant/20">
                    <div className="text-xs font-semibold text-on-surface truncate">
                      {pair.supplier_a}
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-on-surface sm:text-right truncate">
                      {pair.supplier_b}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-on-surface-variant pt-1">
                    <span>{pair.pattern_label}</span>
                    <div className="flex items-center gap-3 font-mono">
                      <span>{pair.shared_processes_count} proc.</span>
                      <span className="font-semibold text-on-surface">
                        {formatDopCompact(pair.combined_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Tabla de Proveedores Recurrentes */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-outline-variant/20">
          <h2 className="text-base font-bold text-on-surface">
            Proveedores con Mayor Concentración de Adjudicaciones
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Adjudicatarios ordenados por frecuencia de procesos y volumen contratado dentro del alcance auditado.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/25 bg-surface-container/50 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="py-3 px-4">Proveedor Adjudicatario</th>
                <th className="py-3 px-4">RPE / Registro</th>
                <th className="py-3 px-4">Organismo Principal</th>
                <th className="py-3 px-4 text-center">Procesos</th>
                <th className="py-3 px-4 text-center">Contratos</th>
                <th className="py-3 px-4 text-right">Monto Acumulado</th>
                <th className="py-3 px-4 text-right">Perfil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 text-sm">
              {recurrent.map((sup, i) => (
                <tr key={`${sup.supplier_name}-${i}`} className="hover:bg-surface-container-high/40">
                  <td className="py-3 px-4 font-medium text-on-surface">{sup.supplier_name}</td>
                  <td className="py-3 px-4 font-mono text-xs text-on-surface-variant">{sup.rpe}</td>
                  <td className="py-3 px-4 text-xs text-on-surface-variant">
                    {sup.institution_name}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-xs font-semibold text-on-surface">
                    {sup.processes_count}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-xs text-on-surface-variant">
                    {sup.contracts_count}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-on-surface">
                    RD$ {sup.total_amount.toLocaleString("es-DO", { maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {sup.rpe && sup.rpe !== "S/R" ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/public/supplier/${encodeURIComponent(sup.rpe)}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-outline-variant/40 text-xs font-semibold text-primary hover:bg-primary/10 cursor-pointer"
                      >
                        Ver Ficha
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-xs text-on-surface-variant">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
