import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search,
  AlertTriangle,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  RotateCcw,
} from "lucide-react"
import { useInstitutionalProcesses } from "../hooks/useAuditorB2G"
import { ProcessInspectorDrawer } from "../components/ConsoleInspectorDrawers"
import AnomalyDrawer from "../components/AnomalyDrawer"
import DataTable from "../components/ui/DataTable"
import StatusChip from "../components/ui/StatusChip"
import KpiCard from "../components/ui/KpiCard"
import type { Anomaly } from "../../domain/anomaly"

function formatCompactDop(amount: number): string {
  const v = amount || 0
  if (v >= 1_000_000_000) return `RD$ ${(v / 1_000_000_000).toFixed(2)}B`
  if (v >= 1_000_000) return `RD$ ${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `RD$ ${(v / 1_000).toFixed(1)}K`
  return `RD$ ${v.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`
}

export default function InstitutionalProcessesPage() {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState("")
  const [appliedQuery, setAppliedQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [onlyWithAnomalies, setOnlyWithAnomalies] = useState(false)
  const [page, setPage] = useState(1)
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null)
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null)
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

  const handleResetFilters = () => {
    setSearchInput("")
    setAppliedQuery("")
    setStatusFilter("")
    setOnlyWithAnomalies(false)
    setPage(1)
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 sm:p-8 max-w-[80rem] mx-auto space-y-6">
      {/* Clean Header matching OverviewDashboardPage & MarketIntelligencePage */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">
            Procesos Institucionales
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Exploración consolidada de procedimientos de compra, contratos adjudicados y señales preventivas asociadas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/app/bandeja")}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-95 transition-opacity shadow-xs shrink-0 cursor-pointer"
        >
          <span>Ir a Bandeja de Anomalías</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* 4 KPI Cards with border-l-4 matching OverviewDashboardPage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Procesos Registrados"
          value={kpis.total_processes.toLocaleString("es-DO")}
          hint="Expedientes bajo cobertura de fiscalización"
        />
        <KpiCard
          label="Contratos Vinculados"
          value={kpis.total_contracts.toLocaleString("es-DO")}
          hint="Órdenes y contratos formalizados"
          accent="neutral"
        />
        <KpiCard
          label="Volumen Fiscalizado"
          value={formatCompactDop(kpis.total_amount)}
          hint="Monto acumulado adjudicado"
          valueClassName="text-primary"
        />
        <KpiCard
          label="Procesos con Hallazgos"
          value={kpis.processes_with_findings.toLocaleString("es-DO")}
          hint="Expedientes con señales preventivas"
          accent="warning"
          valueClassName="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Filter Bar matching UsersManagementPage & RolesMatrixPage */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center gap-3"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por código de proceso, descripción del objeto o proveedor adjudicatario..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface-container-low border border-outline-variant/35 text-xs text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            aria-label="Filtrar por estado de contrato"
            className="h-10 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/35 text-xs font-medium text-on-surface focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="">Todos los estados</option>
            <option value="Activo">Activo / Vigente</option>
            <option value="Cerrado">Cerrado / Liquidado</option>
            <option value="Adjudicado">Adjudicado</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setOnlyWithAnomalies(!onlyWithAnomalies)
              setPage(1)
            }}
            className={`h-10 px-3.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              onlyWithAnomalies
                ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300"
                : "bg-surface-container-low border-outline-variant/35 text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Solo con hallazgos</span>
          </button>

          <button
            type="submit"
            className="h-10 px-4 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-95 transition-opacity cursor-pointer"
          >
            Buscar
          </button>

          {(appliedQuery || statusFilter || onlyWithAnomalies) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/35 text-xs font-medium text-on-surface-variant hover:text-on-surface inline-flex items-center gap-1 cursor-pointer"
              title="Restablecer filtros"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>

      {/* Central Table Section matching OverviewDashboardPage */}
      <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/25 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-bold text-on-surface">
              Listado de Procedimientos y Contratos Fiscalizados
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Ordenados por severidad de hallazgos y volumen contractual adjudicado
            </p>
          </div>
          <span className="px-3 py-1 rounded-lg bg-surface-container-high text-xs font-mono font-semibold text-on-surface shrink-0">
            {(data?.total || 0).toLocaleString("es-DO")} expedientes
          </span>
        </div>

        <DataTable
          rows={items}
          rowKey={(proc) => proc.id}
          isLoading={isLoading}
          emptyMessage="No se encontraron procesos que coincidan con los criterios seleccionados."
          columns={[
            {
              key: "referencia",
              header: "Referencia",
              cell: (proc) => (
                <>
                  <div className="font-mono font-bold text-primary">{proc.process_code}</div>
                  <div className="text-[11px] text-on-surface-variant mt-0.5 font-mono">
                    {proc.signed_date} · {proc.contracts_count}{" "}
                    {proc.contracts_count === 1 ? "contrato" : "contratos"}
                  </div>
                </>
              ),
            },
            {
              key: "objeto",
              header: "Objeto de Contratación",
              cell: (proc) => (
                <>
                  <div className="font-semibold text-on-surface line-clamp-2">{proc.title}</div>
                  <span className="inline-block mt-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                    {proc.status}
                  </span>
                </>
              ),
            },
            {
              key: "unidad",
              header: "Unidad Compradora",
              cellClassName: "text-on-surface-variant",
              cell: (proc) => proc.institution_name,
            },
            {
              key: "proveedor",
              header: "Proveedor Adjudicatario",
              cellClassName: "font-medium text-on-surface",
              cell: (proc) => proc.primary_supplier,
            },
            {
              key: "monto",
              header: "Monto Adjudicado",
              align: "right",
              cellClassName: "font-mono font-bold text-on-surface",
              cell: (proc) => `RD$ ${proc.total_amount.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`,
            },
            {
              key: "hallazgos",
              header: "Estado / Hallazgos",
              align: "center",
              cell: (proc) =>
                proc.anomalies_count > 0 ? (
                  <StatusChip
                    tone="warning"
                    label={`${proc.anomalies_count} alerta${proc.anomalies_count === 1 ? "" : "s"} (${Math.round(
                      proc.max_severity * 100
                    )}%)`}
                    icon={AlertTriangle}
                    iconClassName="w-3.5 h-3.5"
                  />
                ) : (
                  <StatusChip
                    tone="success"
                    label="Sin alertas"
                    icon={CheckCircle2}
                    iconClassName="w-3.5 h-3.5"
                  />
                ),
            },
            {
              key: "expediente",
              header: "Expediente",
              align: "right",
              cell: (proc) => (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAnomaly(null)
                    setSelectedProcessId(proc.id)
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-primary/10 text-primary border border-outline-variant/35 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span>Ver Ficha</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              ),
            },
          ]}
        />

        {/* Pagination Footer */}
        <div className="px-6 py-3.5 border-t border-outline-variant/25 bg-surface-container-low/30 flex items-center justify-between text-xs text-on-surface-variant">
          <span>
            Página <strong className="font-mono text-on-surface">{page}</strong> de{" "}
            <strong className="font-mono text-on-surface">{totalPages}</strong> · Mostrando{" "}
            <strong className="font-mono text-on-surface">{items.length}</strong> de{" "}
            <strong className="font-mono text-on-surface">{(data?.total || 0).toLocaleString("es-DO")}</strong>
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

      {selectedAnomaly ? (
        <AnomalyDrawer
          anomaly={selectedAnomaly}
          onClose={() => setSelectedAnomaly(null)}
        />
      ) : selectedProcessId !== null ? (
        <ProcessInspectorDrawer
          processId={selectedProcessId}
          onClose={() => setSelectedProcessId(null)}
          onSelectAnomaly={(anom) => setSelectedAnomaly(anom)}
        />
      ) : null}
    </div>
  )
}
