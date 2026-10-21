import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search,
  BookmarkPlus,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Calculator,
  RotateCcw,
} from "lucide-react"
import { useB2BOpportunities, useUpsertBid } from "../hooks/useB2BSuite"
import { ProcessInspectorDrawer } from "../components/ConsoleInspectorDrawers"
import DataTable from "../components/ui/DataTable"
import KpiCard from "../components/ui/KpiCard"

function formatDop(val: number): string {
  return `RD$ ${(val || 0).toLocaleString("es-DO", { maximumFractionDigits: 0 })}`
}

function formatCompactDop(amount: number): string {
  const v = amount || 0
  if (v >= 1_000_000_000) return `RD$ ${(v / 1_000_000_000).toFixed(2)}B`
  if (v >= 1_000_000) return `RD$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `RD$ ${(v / 1_000).toFixed(1)}K`
  return `RD$ ${v.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`
}

export default function OpportunitiesRadarPage() {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState("")
  const [appliedQuery, setAppliedQuery] = useState("")
  const [selectedFamily, setSelectedFamily] = useState<string>("")
  const [onlyHighAffinity, setOnlyHighAffinity] = useState(false)
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null)
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null)

  const { data, isLoading } = useB2BOpportunities({
    unspsc_family: selectedFamily || undefined,
    q: appliedQuery || undefined,
    only_high_affinity: onlyHighAffinity,
    page: 1,
    limit: 30,
  })

  const upsertBidMutation = useUpsertBid()

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAppliedQuery(searchInput.trim())
  }

  const handleResetFilters = () => {
    setSearchInput("")
    setAppliedQuery("")
    setSelectedFamily("")
    setOnlyHighAffinity(false)
  }

  const handleQuickSave = async (item: {
    process_id: number
    process_code: string
    title: string
    institution_name: string
    unspsc_family: string
    reference_amount_dop: number
  }) => {
    try {
      await upsertBidMutation.mutateAsync({
        process_id: item.process_id,
        process_code: item.process_code,
        title: item.title,
        institution_name: item.institution_name,
        unspsc_family: item.unspsc_family,
        stage: "GUARDADA",
        priority: "ALTA",
        reference_amount_dop: item.reference_amount_dop,
        bid_amount_dop: item.reference_amount_dop,
        notes: "Guardada desde el Radar de Oportunidades.",
      })
      setSavedSuccessMsg(`Proceso ${item.process_code} añadido a Mis Licitaciones`)
      setTimeout(() => setSavedSuccessMsg(null), 3500)
    } catch {
      setSavedSuccessMsg("Límite de procesos en seguimiento alcanzado en su plan actual.")
      setTimeout(() => setSavedSuccessMsg(null), 4000)
    }
  }

  const kpis = data?.kpis
  const monitoredFamilies = data?.monitored_families || []
  const items = data?.items || []

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 sm:p-8 max-w-[80rem] mx-auto space-y-6">
          {/* Clean Unboxed Header matching InstitutionalProcessesPage & MarketIntelligencePage */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-on-surface">
                Radar de Oportunidades y Alertas UNSPSC
              </h1>
              <p className="text-xs text-on-surface-variant mt-1">
                Detección temprana de convocatorias y licitaciones alineadas con los rubros comerciales de su organización.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate("/app/sectores")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors shadow-xs cursor-pointer"
              >
                <span>Configurar Rubros ({monitoredFamilies.length})</span>
              </button>
              <button
                type="button"
                onClick={() => navigate("/app/mis-licitaciones")}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-95 transition-opacity shadow-xs shrink-0 cursor-pointer"
              >
                <span>Ver Mis Licitaciones</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {savedSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{savedSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => navigate("/app/mis-licitaciones")}
                className="underline hover:no-underline cursor-pointer"
              >
                Abrir Pipeline Comercial
              </button>
            </div>
          )}

          {/* 4 KPI Cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-28 rounded-2xl bg-surface-container-low animate-pulse border border-outline-variant/25"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <KpiCard
                label="Oportunidades Detectadas"
                value={(kpis?.total_opportunities ?? 0).toLocaleString("es-DO")}
                hint={`En sus ${monitoredFamilies.length} rubros UNSPSC activos`}
              />
              <KpiCard
                label="Alta Afinidad Comercial"
                value={`${kpis?.avg_affinity_score ?? 0}%`}
                hint="Afinidad promedio en sus rubros"
                accent="success"
                valueClassName="text-emerald-600 dark:text-emerald-400"
              />
              <KpiCard
                label="Volumen en Oportunidades"
                value={formatCompactDop(kpis?.sector_total_amount_dop ?? 0)}
                hint="Monto referencial acumulado en RD$"
                valueClassName="text-primary"
              />
              <KpiCard
                label="Rubros Monitoreados"
                value={`${kpis?.monitored_families_count ?? monitoredFamilies.length} / ${
                  (kpis?.max_families_allowed ?? 3) >= 999
                    ? "Ilimitados"
                    : (kpis?.max_families_allowed ?? 3)
                }`}
                hint="Familias del clasificador UNSPSC"
                accent="neutral"
              />
            </div>
          )}

          {/* Filter Bar matching InstitutionalProcessesPage */}
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
                placeholder="Buscar por código de proceso, descripción del objeto o institución compradora..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface-container-low border border-outline-variant/35 text-xs text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={selectedFamily}
                onChange={(e) => setSelectedFamily(e.target.value)}
                aria-label="Filtrar por rubro UNSPSC"
                className="h-10 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/35 text-xs font-medium text-on-surface focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="">Todos mis rubros ({monitoredFamilies.length})</option>
                {monitoredFamilies.map((f) => (
                  <option key={f.code} value={f.code}>
                    {f.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setOnlyHighAffinity(!onlyHighAffinity)}
                className={`h-10 px-3.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  onlyHighAffinity
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-surface-container-low border-outline-variant/35 text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Alta afinidad (≥ 80%)</span>
              </button>

              <button
                type="submit"
                className="h-10 px-4 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-95 transition-opacity cursor-pointer"
              >
                Buscar
              </button>

              {(appliedQuery || selectedFamily || onlyHighAffinity) && (
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

          {/* Central Table Section matching InstitutionalProcessesPage */}
          <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant/25 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-bold text-on-surface">
                  Convocatorias y Oportunidades Comerciales Detectadas
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Ordenadas por porcentaje de afinidad con el historial de adjudicaciones y rubros de su organización
                </p>
              </div>
              <span className="px-3 py-1 rounded-lg bg-surface-container-high text-xs font-mono font-semibold text-on-surface shrink-0">
                {(data?.total || 0).toLocaleString("es-DO")} oportunidades
              </span>
            </div>

            <DataTable
              rows={items}
              rowKey={(row) => row.process_id}
              isLoading={isLoading}
              emptyMessage="No se encontraron oportunidades con los filtros seleccionados."
              columns={[
                {
                  key: "afinidad",
                  header: "Afinidad",
                  cellClassName: "whitespace-nowrap",
                  cell: (row) => (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${
                        row.affinity_score >= 85
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : row.affinity_score >= 70
                            ? "bg-primary/15 text-primary"
                            : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      {row.affinity_score}%
                    </span>
                  ),
                },
                {
                  key: "proceso",
                  header: "Proceso y Objeto de Contratación",
                  cellClassName: "max-w-[340px]",
                  cell: (row) => (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedProcessId(row.process_id)}
                        className="font-mono font-bold text-primary hover:underline text-left block cursor-pointer"
                      >
                        {row.process_code}
                      </button>
                      <p className="font-medium text-on-surface line-clamp-2 mt-0.5">{row.title}</p>
                      <span className="text-[11px] text-on-surface-variant font-mono">
                        {row.modality} · {row.published_date}
                      </span>
                    </>
                  ),
                },
                {
                  key: "institucion",
                  header: "Institución Compradora",
                  cellClassName: "text-on-surface-variant max-w-[220px] truncate",
                  cell: (row) => row.institution_name,
                },
                {
                  key: "rubro",
                  header: "Rubro UNSPSC",
                  cellClassName: "whitespace-nowrap",
                  cell: (row) => (
                    <span className="px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/30 font-mono text-[11px] font-semibold text-on-surface">
                      UNSPSC {row.unspsc_family}
                    </span>
                  ),
                },
                {
                  key: "monto",
                  header: "Monto Estimado",
                  align: "right",
                  cellClassName: "font-mono font-bold text-on-surface whitespace-nowrap",
                  cell: (row) => formatDop(row.reference_amount_dop),
                },
                {
                  key: "competencia",
                  header: "Competencia",
                  align: "center",
                  cellClassName: "whitespace-nowrap",
                  cell: (row) => (
                    <span
                      className={`inline-block text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md ${
                        row.competition_level === "BAJA"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : row.competition_level === "MEDIA"
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                            : "bg-red-500/15 text-red-700 dark:text-red-300"
                      }`}
                    >
                      {row.competition_level} ({row.historical_competitors_count} ofer.)
                    </span>
                  ),
                },
                {
                  key: "acciones",
                  header: "Acciones",
                  align: "right",
                  cellClassName: "whitespace-nowrap",
                  cell: (row) => (
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/app/simulador-precios?unspsc=${row.unspsc_family}&amt=${row.reference_amount_dop}`
                          )
                        }
                        className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                        title="Simular precio competitivo para este rubro"
                        aria-label="Simular precio competitivo para este rubro"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={row.in_watchlist || upsertBidMutation.isPending}
                        onClick={() => handleQuickSave(row)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          row.in_watchlist
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 cursor-default"
                            : "bg-primary/10 text-primary hover:bg-primary/20"
                        }`}
                      >
                        {row.in_watchlist ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>En Pipeline</span>
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="w-3.5 h-3.5" />
                            <span>Guardar</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedProcessId(row.process_id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 text-xs font-semibold text-on-surface transition-colors cursor-pointer"
                      >
                        <span>Expediente</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>

      {selectedProcessId !== null && (
        <ProcessInspectorDrawer
          processId={selectedProcessId}
          onClose={() => setSelectedProcessId(null)}
          onSelectAnomaly={() => {}}
        />
      )}
    </div>
  )
}
