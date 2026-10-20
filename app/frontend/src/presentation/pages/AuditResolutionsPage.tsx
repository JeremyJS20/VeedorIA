import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  CheckCircle2,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  RotateCcw,
} from "lucide-react"
import { useAuditResolutions, type AuditResolutionItem } from "../hooks/useAuditorB2G"
import AnomalyDrawer from "../components/AnomalyDrawer"
import type { Anomaly } from "../../domain/anomaly"

function formatCompactDop(amount: number): string {
  const v = amount || 0
  if (v >= 1_000_000_000) return `RD$ ${(v / 1_000_000_000).toFixed(2)}B`
  if (v >= 1_000_000) return `RD$ ${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `RD$ ${(v / 1_000).toFixed(1)}K`
  return `RD$ ${v.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`
}

export default function AuditResolutionsPage() {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState("")
  const [appliedQuery, setAppliedQuery] = useState("")
  const [decisionFilter, setDecisionFilter] = useState("")
  const [page, setPage] = useState(1)
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null)

  const handleInspectResolution = (item: AuditResolutionItem) => {
    setSelectedAnomaly({
      id: item.id,
      process_id: null,
      contract_id: null,
      anomaly_type: (item.anomaly_type as Anomaly["anomaly_type"]) || "PRICE_ANOMALY",
      severity: item.severity,
      confidence: null,
      signals_count: null,
      status: (item.status as Anomaly["status"]) || "CONFIRMED",
      description: item.resolution_summary,
      amount: item.amount,
      process_code: item.process_code,
      supplier_name: item.supplier_name,
      institution_name: item.institution_name,
      created_at: item.resolved_at,
    })
  }
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
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 sm:p-8 max-w-[80rem] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">
            Historial de Resoluciones y Dictámenes
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Registro auditable de hallazgos dictaminados como confirmados o desestimados tras su revisión técnica.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/app/bandeja")}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-95 transition-opacity shadow-xs shrink-0 cursor-pointer"
        >
          <span>Emitir Nuevo Dictamen</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* 4 KPI Cards matching OverviewDashboardPage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-primary rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Total Dictaminadas
          </span>
          <div className="mt-2.5 space-y-1">
            <p className="font-mono text-2xl font-bold text-on-surface tracking-tight">
              {kpis.total_resolved.toLocaleString("es-DO")}
            </p>
            <p className="text-xs text-on-surface-variant">
              Casos con resolución formal emitida
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-red-600 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Irregularidades Confirmadas
          </span>
          <div className="mt-2.5 space-y-1">
            <p className="font-mono text-2xl font-bold text-red-600 dark:text-red-400 tracking-tight">
              {kpis.confirmed_count.toLocaleString("es-DO")}
            </p>
            <p className="text-xs text-on-surface-variant">
              Ratificadas para expediente de control
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-outline-variant rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Alertas Desestimadas
          </span>
          <div className="mt-2.5 space-y-1">
            <p className="font-mono text-2xl font-bold text-on-surface tracking-tight">
              {kpis.dismissed_count.toLocaleString("es-DO")}
            </p>
            <p className="text-xs text-on-surface-variant">
              Descargadas con justificación documental
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-primary rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Volumen Dictaminado
          </span>
          <div className="mt-2.5 space-y-1">
            <p className="font-mono text-2xl font-bold text-primary tracking-tight">
              {formatCompactDop(kpis.audited_amount)}
            </p>
            <p className="text-xs text-on-surface-variant">
              Monto involucrado en casos resueltos
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <form
        onSubmit={handleSearch}
        className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center gap-3"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por código de proceso, proveedor adjudicatario o entidad..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface-container-low border border-outline-variant/35 text-xs text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {[
            { id: "", label: "Todos los dictámenes" },
            { id: "CONFIRMED", label: "Solo Confirmadas" },
            { id: "DISMISSED", label: "Solo Desestimadas" },
          ].map((pill) => {
            const active = decisionFilter === pill.id
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => {
                  setDecisionFilter(pill.id)
                  setPage(1)
                }}
                className={`h-10 px-3.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-surface-container-low border-outline-variant/35 text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {pill.label}
              </button>
            )
          })}

          <button
            type="submit"
            className="h-10 px-4 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-95 transition-opacity cursor-pointer"
          >
            Filtrar
          </button>

          {(appliedQuery || decisionFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("")
                setAppliedQuery("")
                setDecisionFilter("")
                setPage(1)
              }}
              className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/35 text-xs font-medium text-on-surface-variant hover:text-on-surface inline-flex items-center gap-1 cursor-pointer"
              title="Restablecer filtros"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>

      {/* Central Table Section */}
      <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/25 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-bold text-on-surface">
              Bitácora Histórica de Dictámenes Emitidos
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Ordenados cronológicamente por fecha de resolución y nivel de severidad
            </p>
          </div>
          <span className="px-3 py-1 rounded-lg bg-surface-container-high text-xs font-mono font-semibold text-on-surface shrink-0">
            {(data?.total || 0).toLocaleString("es-DO")} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/25 bg-surface-container-low/60 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="py-3 px-5">Proceso / Fecha</th>
                <th className="py-3 px-5">Tipología de Alerta</th>
                <th className="py-3 px-5">Entidad / Proveedor</th>
                <th className="py-3 px-5">Dictamen</th>
                <th className="py-3 px-5">Fundamento de Resolución</th>
                <th className="py-3 px-5 text-right">Monto Auditado</th>
                <th className="py-3 px-5 text-right">Expediente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center font-mono text-on-surface-variant">
                    Consultando historial de dictámenes...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    Aún no se registran dictámenes que coincidan con el filtro seleccionado. Puede confirmar o desestimar alertas desde la Bandeja de Anomalías.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-surface-container-low/50 transition-colors"
                  >
                    <td className="py-3.5 px-5 align-top">
                      <div className="font-mono font-bold text-primary">
                        {item.process_code}
                      </div>
                      <div className="text-[11px] font-mono text-on-surface-variant mt-0.5">
                        {item.resolved_at}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 align-top">
                      <div className="font-semibold text-on-surface">
                        {item.anomaly_type_label}
                      </div>
                      <div className="text-[11px] font-mono text-on-surface-variant mt-0.5">
                        Severidad {Math.round(item.severity * 100)}%
                      </div>
                    </td>
                    <td className="py-3.5 px-5 align-top">
                      <div className="font-semibold text-on-surface">
                        {item.supplier_name}
                      </div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5">
                        {item.institution_name}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 align-top">
                      {item.status === "CONFIRMED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/25">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Confirmada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-surface-container-high text-on-surface-variant border border-outline-variant/30">
                          <XCircle className="w-3.5 h-3.5" />
                          Desestimada
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 align-top text-on-surface-variant">
                      {item.resolution_summary}
                    </td>
                    <td className="py-3.5 px-5 align-top text-right font-mono font-bold text-on-surface">
                      RD$ {item.amount.toLocaleString("es-DO", { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3.5 px-5 align-top text-right">
                      <button
                        type="button"
                        onClick={() => handleInspectResolution(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-primary/10 text-primary border border-outline-variant/35 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <span>Ver Caso</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3.5 border-t border-outline-variant/25 bg-surface-container-low/30 flex items-center justify-between text-xs text-on-surface-variant">
          <span>
            Página <strong className="font-mono text-on-surface">{page}</strong> de{" "}
            <strong className="font-mono text-on-surface">{totalPages}</strong> · Total:{" "}
            <strong className="font-mono text-on-surface">{(data?.total || 0).toLocaleString("es-DO")}</strong> dictámenes
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-outline-variant/35 bg-surface disabled:opacity-40 hover:bg-surface-container-low inline-flex items-center gap-1 font-semibold text-on-surface cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl border border-outline-variant/35 bg-surface disabled:opacity-40 hover:bg-surface-container-low inline-flex items-center gap-1 font-semibold text-on-surface cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
        </div>
      </div>

      {selectedAnomaly && (
        <AnomalyDrawer
          anomaly={selectedAnomaly}
          onClose={() => setSelectedAnomaly(null)}
        />
      )}
    </div>
  )
}
