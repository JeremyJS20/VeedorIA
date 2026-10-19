import { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Download, FileJson, Loader2, Search, X } from "lucide-react"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import SectionContainer from "../components/SectionContainer"
import BudgetSankeyCard from "../components/public/BudgetSankeyCard"
import ProvincialMapCard from "../components/public/ProvincialMapCard"
import LivePriceCheckerWidget from "../components/public/LivePriceCheckerWidget"
import {
  usePublicBudgetOverview,
  usePublicInstitutions,
  usePublicPriceComparisons,
  usePublicTenders,
} from "../hooks/usePublicPortal"
import { exportTendersToCsv, exportTendersToJson } from "../utils/exportOpenData"

const NATURAL_SUGGESTIONS = [
  {
    label: "¿Cuánto gastó mi provincia?",
    displayQuery: "Gasto público en Santiago",
    action: { search: "", province: "ST", onlyAnomalies: false },
  },
  {
    label: "Laptops en Educación (MINERD)",
    displayQuery: "Laptops en Educación (MINERD)",
    action: { search: "Laptops MINERD", province: "", onlyAnomalies: false },
  },
  {
    label: "Proveedores con alertas en Obras Públicas",
    displayQuery: "Proveedores con alertas en Obras Públicas",
    action: { search: "Obras Públicas", province: "", onlyAnomalies: true },
  },
  {
    label: "Contratos de asfalto en Santiago",
    displayQuery: "Contratos de asfalto en Santiago",
    action: { search: "Asfalto", province: "ST", onlyAnomalies: false },
  },
]

export default function CivicPortalPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const resultsRef = useRef<HTMLElement>(null)

  const initialInstId = searchParams.get("institution_id")
  const initialQuery = searchParams.get("q") || ""

  const [searchInput, setSearchInput] = useState(initialQuery)
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery)
  const [activeChipLabel, setActiveChipLabel] = useState<string | null>(null)
  const [institutionId, setInstitutionId] = useState<number | undefined>(
    initialInstId ? Number(initialInstId) : undefined,
  )
  const [province, setProvince] = useState("")
  const [onlyWithAnomalies, setOnlyWithAnomalies] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data: institutions } = usePublicInstitutions()
  const { data: budgetOverview } = usePublicBudgetOverview()
  const { data: priceComparisons } = usePublicPriceComparisons()
  const { data: tendersData, isLoading: tendersLoading, isFetching: tendersFetching } = usePublicTenders({
    search: debouncedSearch || undefined,
    institution_id: institutionId,
    province: province || undefined,
    only_with_anomalies: onlyWithAnomalies,
    page,
    limit: 12,
  })

  const handleExecuteSearch = () => {
    setActiveChipLabel(null)
    setDebouncedSearch(searchInput.trim())
    setPage(1)
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  const handleChipClick = (chip: (typeof NATURAL_SUGGESTIONS)[number]) => {
    setActiveChipLabel(chip.label)
    setSearchInput(chip.displayQuery)
    setDebouncedSearch(chip.action.search)
    setProvince(chip.action.province)
    setOnlyWithAnomalies(chip.action.onlyAnomalies)
    setInstitutionId(undefined)
    setPage(1)
  }

  const handleResetFilters = () => {
    setActiveChipLabel(null)
    setSearchInput("")
    setDebouncedSearch("")
    setInstitutionId(undefined)
    setProvince("")
    setOnlyWithAnomalies(false)
    setPage(1)
  }

  const hasActiveFilters = Boolean(
    debouncedSearch || institutionId !== undefined || province || onlyWithAnomalies || activeChipLabel,
  )

  const items = tendersData?.items || []
  const totalPages = Math.max(1, Math.ceil((tendersData?.total || 0) / 12))

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-4 md:px-8">
        <SectionContainer className="space-y-8">
          <div className="bg-surface rounded-lg p-6 md:p-8 border border-outline-variant/30 shadow-sm">
            <h1 className="text-[28px] md:text-[32px] font-display font-bold text-center text-on-surface mb-6">
              Portal de Veeduría Ciudadana
            </h1>

            <div className="max-w-4xl mx-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleExecuteSearch()
                }}
                className="flex flex-col sm:flex-row gap-2"
              >
                <div className="flex-1 flex items-center bg-background border border-outline-variant/40 focus-within:border-primary rounded px-4 h-14">
                  <Search className="w-5 h-5 text-outline shrink-0 mr-3" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => {
                      setActiveChipLabel(null)
                      setSearchInput(e.target.value)
                    }}
                    placeholder="¿Qué deseas fiscalizar hoy? (ej. Laptops en MINERD, Asfalto en Obras Públicas)"
                    className="w-full bg-transparent text-sm md:text-base text-on-surface placeholder:text-outline focus:outline-none"
                  />
                  {(searchInput || hasActiveFilters) && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-xs font-medium text-outline hover:text-on-surface px-2 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Limpiar</span>
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="h-14 px-8 rounded bg-primary text-on-primary font-semibold text-sm hover:opacity-95 transition-opacity cursor-pointer shrink-0 inline-flex items-center justify-center gap-2"
                >
                  {tendersFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Buscar</span>
                </button>
              </form>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-on-surface-variant">Sugerencias de búsqueda:</span>
                {NATURAL_SUGGESTIONS.map((chip) => {
                  const isSelected = activeChipLabel === chip.label
                  return (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => handleChipClick(chip)}
                      className={`h-8 px-3 rounded-[20px] text-xs font-medium transition-colors cursor-pointer border ${
                        isSelected
                          ? "bg-primary text-on-primary border-primary font-semibold"
                          : "bg-surface-container-low text-primary border-transparent hover:bg-primary/10"
                      }`}
                    >
                      {chip.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <section
            ref={resultsRef}
            className="bg-surface rounded-lg p-6 md:p-8 border border-outline-variant/30 shadow-sm space-y-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[20px] font-display font-bold text-on-surface">
                    Contrataciones Adjudicadas
                  </h2>
                  {tendersFetching && (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  )}
                </div>
                <p className="text-sm text-on-surface-variant">
                  <span className="font-mono font-bold text-primary">
                    {(tendersData?.total || 0).toLocaleString("es-DO")}
                  </span>{" "}
                  registros encontrados · Volumen filtrado:{" "}
                  <span className="font-mono font-semibold text-on-surface">
                    RD${" "}
                    {(tendersData?.total_amount_filtered || 0).toLocaleString("es-DO", {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                  {province ? ` · Provincia: ${province}` : ""}
                  {onlyWithAnomalies ? " · Solo con hallazgos" : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportTendersToCsv(items)}
                  disabled={items.length === 0}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-surface-container-low hover:bg-primary/10 border border-outline-variant/30 text-xs font-semibold text-on-surface cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-primary" />
                  <span>Exportar CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportTendersToJson(items)}
                  disabled={items.length === 0}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-surface-container-low hover:bg-primary/10 border border-outline-variant/30 text-xs font-semibold text-on-surface cursor-pointer disabled:opacity-50"
                >
                  <FileJson className="w-4 h-4 text-primary" />
                  <span>Exportar JSON</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-outline block mb-1">
                  Institución
                </label>
                <select
                  value={institutionId ?? ""}
                  onChange={(e) => {
                    setActiveChipLabel(null)
                    setInstitutionId(e.target.value ? Number(e.target.value) : undefined)
                    setPage(1)
                  }}
                  className="w-full px-3 py-2 rounded bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="">Todas las instituciones ({institutions?.length || 730})</option>
                  {institutions?.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.contracts_count})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2.5 p-2 rounded bg-surface-container-low border border-outline-variant/30 w-full cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyWithAnomalies}
                    onChange={(e) => {
                      setActiveChipLabel(null)
                      setOnlyWithAnomalies(e.target.checked)
                      setPage(1)
                    }}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm font-medium text-on-surface">
                    Solo con hallazgos de auditoría
                  </span>
                </label>
              </div>

              <div className="flex items-end justify-end">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  disabled={!hasActiveFilters && !searchInput}
                  className="w-full md:w-auto px-4 py-2 rounded bg-surface-container-low hover:bg-surface-container-highest border border-outline-variant/30 text-xs font-semibold text-outline hover:text-on-surface disabled:opacity-40 cursor-pointer"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>

            {tendersLoading ? (
              <div className="py-12 text-center text-outline text-sm">Cargando contrataciones...</div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <p className="text-sm text-on-surface-variant">
                  No se encontraron contrataciones con los filtros seleccionados.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded bg-primary text-on-primary text-xs font-semibold cursor-pointer"
                >
                  Restablecer búsqueda
                </button>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/20 border-t border-outline-variant/20">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-outline">
                        <span>{item.dgcp_code}</span>
                        <span>·</span>
                        <span>Contrato {item.contract_code}</span>
                        {item.anomaly_count > 0 && (
                          <span className="text-error font-semibold">
                            · {item.anomaly_count} hallazgo(s) ({item.max_severity}%)
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate(`/public/process/${item.id}`)}
                        className="text-left text-base font-semibold text-on-surface hover:text-primary transition-colors line-clamp-1 cursor-pointer"
                      >
                        {item.title}
                      </button>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
                        {item.institution_id ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/public/institution/${item.institution_id}`)}
                            className="hover:text-primary hover:underline cursor-pointer"
                          >
                            {item.institution_name}
                          </button>
                        ) : (
                          <span>{item.institution_name}</span>
                        )}
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/public/supplier/${encodeURIComponent(
                                item.supplier_rpe !== "N/A" ? item.supplier_rpe : item.supplier_name,
                              )}`,
                            )
                          }
                          className="hover:text-primary hover:underline cursor-pointer"
                        >
                          {item.supplier_name} (RPE: {item.supplier_rpe})
                        </button>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0">
                      <span className="text-base font-mono font-bold text-on-surface">
                        RD${" "}
                        {item.amount_adjudicated.toLocaleString("es-DO", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate(`/public/process/${item.id}`)}
                        className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                      >
                        Ver expediente →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20">
                <span className="text-xs text-outline font-mono">
                  Página {page} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded bg-surface-container-low border border-outline-variant/30 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded bg-surface-container-low border border-outline-variant/30 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </section>

          {budgetOverview && (
            <BudgetSankeyCard
              institutions={budgetOverview.sankey.institutions}
              suppliers={budgetOverview.sankey.suppliers}
              links={budgetOverview.sankey.links}
              totalFlowAmount={budgetOverview.sankey.total_flow_amount}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {budgetOverview && (
              <ProvincialMapCard
                provinces={budgetOverview.provinces}
                selectedProvince={province}
                onSelectProvince={(p) => {
                  setActiveChipLabel(null)
                  setProvince(p)
                  setPage(1)
                  resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
                }}
              />
            )}
            {priceComparisons && priceComparisons.length > 0 && (
              <LivePriceCheckerWidget items={priceComparisons} />
            )}
          </div>
        </SectionContainer>
      </main>

      <Footer />
    </div>
  )
}