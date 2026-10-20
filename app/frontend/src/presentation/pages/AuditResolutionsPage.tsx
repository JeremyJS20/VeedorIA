import { useState } from "react"
import {
  CheckCircle2,
  XCircle,
  Scale,
  DollarSign,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
} from "lucide-react"
import { useAuditResolutions } from "../hooks/useAuditorB2G"

function formatDopCompact(val: number): string {
  if (val >= 1_000_000_000) return `RD$ ${(val / 1_000_000_000).toFixed(2)}B`
  if (val >= 1_000_000) return `RD$ ${(val / 1_000_000).toFixed(2)}M`
  if (val >= 1_000) return `RD$ ${(val / 1_000).toFixed(1)}K`
  return `RD$ ${val.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`
}

export default function AuditResolutionsPage() {
  const [searchInput, setSearchInput] = useState("")
  const [appliedQuery, setAppliedQuery] = useState("")
  const [decisionFilter, setDecisionFilter] = useState("")
  const [page, setPage] = useState(1)
  const limit = 15

  const { data, isLoading } = useAuditResolutions({
    decision: decisionFilter,
    q: appliedQuery,
    page,
    limit,
  })

  const kpis = data?.kpis || {
    total_resolved: 0,
    confirmed_count: 0,
    dismissed_count: 0,
    audited_amount: 0,
  }
  const items = data?.items || []
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / limit))

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setAppliedQuery(searchInput.trim())
    setPage(1)
  }

  return (
    <div className="p-6 sm:p-8 max-w-[80rem] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">
          Historial de Resoluciones
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Registro auditable de hallazgos dictaminados como confirmados o desestimados tras su revisión técnica.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Total Dictaminadas
            </span>
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-on-surface">
            {kpis.total_resolved.toLocaleString("es-DO")}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Casos con dictamen formal emitido
          </p>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Irregularidades Confirmadas
            </span>
            <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-red-600 dark:text-red-400">
            {kpis.confirmed_count.toLocaleString("es-DO")}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Ratificadas para expediente de control
          </p>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Alertas Desestimadas
            </span>
            <div className="w-9 h-9 rounded-lg bg-surface-container-high text-on-surface-variant flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-on-surface">
            {kpis.dismissed_count.toLocaleString("es-DO")}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Descargadas con justificación documental
          </p>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Volumen Dictaminado
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-on-surface">
            {formatDopCompact(kpis.audited_amount)}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Monto involucrado en casos resueltos
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4">
        <form
          onSubmit={handleSearch}
          className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por código de proceso, proveedor adjudicatario o entidad..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface border border-outline-variant/40 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-on-surface-variant" />
              <select
                value={decisionFilter}
                onChange={(e) => {
                  setDecisionFilter(e.target.value)
                  setPage(1)
                }}
                aria-label="Filtrar por tipo de dictamen"
                className="h-10 px-3 rounded-lg bg-surface border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="">Todos los dictámenes</option>
                <option value="CONFIRMED">Solo Confirmadas</option>
                <option value="DISMISSED">Solo Desestimadas</option>
              </select>
            </div>

            <button
              type="submit"
              className="h-10 px-4 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Filtrar Historial
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de Resoluciones */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/25 bg-surface-container/50 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="py-3.5 px-4">Proceso / Fecha</th>
                <th className="py-3.5 px-4">Tipología de Alerta</th>
                <th className="py-3.5 px-4">Entidad / Proveedor</th>
                <th className="py-3.5 px-4">Dictamen</th>
                <th className="py-3.5 px-4">Fundamento de Resolución</th>
                <th className="py-3.5 px-4 text-right">Monto Auditado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                    Consultando historial de dictámenes...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center gap-2">
                      <FileCheck2 className="w-7 h-7 text-on-surface-variant/60" />
                      <span>
                        Aún no se registran dictámenes que coincidan con el filtro seleccionado. Puede confirmar o desestimar alertas desde la Bandeja de Anomalías.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-surface-container-high/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-mono text-xs font-semibold text-primary">
                        {item.process_code}
                      </div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5">
                        {item.resolved_at}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-medium text-on-surface text-xs">
                        {item.anomaly_type_label}
                      </div>
                      <div className="text-[11px] font-mono text-on-surface-variant mt-0.5">
                        Severidad {Math.round(item.severity * 100)}%
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <div className="text-xs font-medium text-on-surface">
                        {item.supplier_name}
                      </div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5">
                        {item.institution_name}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      {item.status === "CONFIRMED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-600 dark:text-red-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Confirmada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface-variant">
                          <XCircle className="w-3.5 h-3.5" />
                          Desestimada
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 align-top text-xs text-on-surface-variant">
                      {item.resolution_summary}
                    </td>
                    <td className="py-3.5 px-4 align-top text-right font-mono text-xs font-semibold text-on-surface">
                      RD$ {item.amount.toLocaleString("es-DO", { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
          <span>
            Página <strong className="text-on-surface">{page}</strong> de{" "}
            <strong className="text-on-surface">{totalPages}</strong> · Total:{" "}
            <strong className="text-on-surface">{(data?.total || 0).toLocaleString("es-DO")}</strong> dictámenes
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-outline-variant/40 bg-surface disabled:opacity-40 hover:bg-surface-container-high flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Anterior
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-outline-variant/40 bg-surface disabled:opacity-40 hover:bg-surface-container-high flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            >
              Siguiente
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
