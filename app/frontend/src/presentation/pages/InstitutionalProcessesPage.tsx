import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  FolderKanban,
  FileText,
  DollarSign,
  AlertTriangle,
  Search,
  Filter,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react"
import { useInstitutionalProcesses } from "../hooks/useAuditorB2G"

function formatDopCompact(val: number): string {
  if (val >= 1_000_000_000) return `RD$ ${(val / 1_000_000_000).toFixed(2)}B`
  if (val >= 1_000_000) return `RD$ ${(val / 1_000_000).toFixed(2)}M`
  if (val >= 1_000) return `RD$ ${(val / 1_000).toFixed(1)}K`
  return `RD$ ${val.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`
}

export default function InstitutionalProcessesPage() {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState("")
  const [appliedQuery, setAppliedQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [onlyWithAnomalies, setOnlyWithAnomalies] = useState(false)
  const [page, setPage] = useState(1)
  const limit = 15

  const { data, isLoading } = useInstitutionalProcesses({
    q: appliedQuery,
    status: statusFilter,
    only_with_anomalies: onlyWithAnomalies,
    page,
    limit,
  })

  const kpis = data?.kpis || {
    total_processes: 0,
    total_contracts: 0,
    total_amount: 0,
    processes_with_findings: 0,
  }
  const items = data?.items || []
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / limit))

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAppliedQuery(searchInput.trim())
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">
            Procesos Institucionales
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Exploración consolidada de procedimientos de compra, contratos adjudicados y alertas preventivas asociadas.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Procesos Registrados
            </span>
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-on-surface">
            {kpis.total_processes.toLocaleString("es-DO")}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Expedientes bajo cobertura de fiscalización
          </p>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Contratos Vinculados
            </span>
            <div className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-on-surface">
            {kpis.total_contracts.toLocaleString("es-DO")}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Órdenes y contratos formalizados
          </p>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Volumen Fiscalizado
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-on-surface">
            {formatDopCompact(kpis.total_amount)}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Monto acumulado adjudicado en el alcance
          </p>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Procesos con Hallazgos
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {kpis.processes_with_findings.toLocaleString("es-DO")}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Expedientes con una o más señales preventivas
          </p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por código de proceso, descripción del objeto o proveedor adjudicatario..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface border border-outline-variant/40 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-on-surface-variant" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                aria-label="Filtrar por estado de contrato"
                className="h-10 px-3 rounded-lg bg-surface border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="">Todos los estados</option>
                <option value="Activo">Activo / Vigente</option>
                <option value="Cerrado">Cerrado / Liquidado</option>
                <option value="Adjudicado">Adjudicado</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setOnlyWithAnomalies(!onlyWithAnomalies)
                setPage(1)
              }}
              className={`h-10 px-3.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                onlyWithAnomalies
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300"
                  : "bg-surface border-outline-variant/40 text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Solo con hallazgos
            </button>

            <button
              type="submit"
              className="h-10 px-4 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Aplicar Filtro
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de Procesos */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/25 bg-surface-container/50 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="py-3.5 px-4">Código / Fecha</th>
                <th className="py-3.5 px-4">Objeto de Contratación</th>
                <th className="py-3.5 px-4">Unidad Compradora</th>
                <th className="py-3.5 px-4">Proveedor Principal</th>
                <th className="py-3.5 px-4 text-right">Monto Total</th>
                <th className="py-3.5 px-4 text-center">Hallazgos</th>
                <th className="py-3.5 px-4 text-right">Expediente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    Consultando procesos institucionales...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    No se encontraron procesos que coincidan con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                items.map((proc) => (
                  <tr
                    key={proc.id}
                    className="hover:bg-surface-container-high/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-mono text-xs font-semibold text-primary">
                        {proc.process_code}
                      </div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5">
                        {proc.signed_date} · {proc.contracts_count} contr.
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-medium text-on-surface line-clamp-2">
                        {proc.title}
                      </div>
                      <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                        {proc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 align-top text-xs text-on-surface-variant">
                      {proc.institution_name}
                    </td>
                    <td className="py-3.5 px-4 align-top text-xs text-on-surface">
                      {proc.primary_supplier}
                    </td>
                    <td className="py-3.5 px-4 align-top text-right font-mono text-xs font-semibold text-on-surface">
                      RD$ {proc.total_amount.toLocaleString("es-DO", { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3.5 px-4 align-top text-center">
                      {proc.anomalies_count > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {proc.anomalies_count} ({Math.round(proc.max_severity * 100)}%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Sin alertas
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 align-top text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/public/process/${proc.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-primary/10 text-primary border border-outline-variant/40 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Ficha
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="px-4 py-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
          <span>
            Página <strong className="text-on-surface">{page}</strong> de{" "}
            <strong className="text-on-surface">{totalPages}</strong> · Total:{" "}
            <strong className="text-on-surface">{(data?.total || 0).toLocaleString("es-DO")}</strong> procesos
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
