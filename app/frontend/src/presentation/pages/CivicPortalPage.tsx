import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  AlertTriangle,
  Building2,
  Download,
  FileJson,
  Filter,
  Search,
  Sparkles,
  UserCheck,
} from "lucide-react"
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
    action: { search: "", province: "ST", onlyAnomalies: false },
  },
  {
    label: "Laptops con sobreprecio en MINERD",
    action: { search: "Laptops MINERD", province: "", onlyAnomalies: true },
  },
  {
    label: "Proveedores con alertas en Obras Públicas",
    action: { search: "Obras Públicas", province: "", onlyAnomalies: true },
  },
  {
    label: "Contratos de asfalto en Santiago",
    action: { search: "Asfalto", province: "ST", onlyAnomalies: false },
  },
]

export default function CivicPortalPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialInstId = searchParams.get("institution_id")
  const initialQuery = searchParams.get("q") || ""

  const [searchInput, setSearchInput] = useState(initialQuery)
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery)
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
  const { data: tendersData, isLoading: tendersLoading } = usePublicTenders({
    search: debouncedSearch || undefined,
    institution_id: institutionId,
    province: province || undefined,
    only_with_anomalies: onlyWithAnomalies,
    page,
    limit: 15,
  })

  const handleChipClick = (chip: (typeof NATURAL_SUGGESTIONS)[number]) => {
    setSearchInput(chip.action.search)
    setDebouncedSearch(chip.action.search)
    setProvince(chip.action.province)
    setOnlyWithAnomalies(chip.action.onlyAnomalies)
    setInstitutionId(undefined)
    setPage(1)
  }

  const handleResetFilters = () => {
    setSearchInput("")
    setDebouncedSearch("")
    setInstitutionId(undefined)
    setProvince("")
    setOnlyWithAnomalies(false)
    setPage(1)
  }

  const items = tendersData?.items || []
  const totalPages = Math.max(1, Math.ceil((tendersData?.total || 0) / 15))

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-4 md:px-8">
        <SectionContainer className="space-y-10">
          <div className="text-center max-w-4xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold uppercase tracking-widest text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Módulo I · Veeduría Ciudadana y Datos Abiertos (NORTIC A4:2024)</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight">
              Portal de Veeduría Ciudadana
            </h1>
            <p className="text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto">
              Fiscaliza en tiempo real 20,380 contratos públicos, 730 instituciones y 1,262 alertas de inteligencia artificial sin necesidad de cuenta.
            </p>

            <div className="relative max-w-3xl mx-auto mt-6">
              <div className="flex items-center bg-surface-container-low border-2 border-primary/30 focus-within:border-primary rounded-2xl px-4 py-2 shadow-lg">
                <Search className="w-5 h-5 text-primary shrink-0 mr-3" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="¿Qué deseas fiscalizar hoy? (ej. Laptops en MINERD, Asfalto en Obras Públicas)"
                  className="w-full bg-transparent text-sm md:text-base text-on-surface placeholder:text-outline focus:outline-none py-2"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput("")}
                    className="text-xs font-bold text-outline hover:text-on-surface px-2 cursor-pointer"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs font-semibold text-outline">Sugerencias de búsqueda:</span>
                {NATURAL_SUGGESTIONS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleChipClick(chip)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-surface-container-low hover:bg-primary hover:text-on-primary border border-outline-variant/30 transition-all cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

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
                  setProvince(p)
                  setPage(1)
                }}
              />
            )}
            {priceComparisons && priceComparisons.length > 0 && (
              <LivePriceCheckerWidget items={priceComparisons} />
            )}
          </div>

          <section className="glass rounded-3xl p-6 md:p-8 border border-outline-variant/25 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-display font-bold text-on-surface flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" />
                  <span>Explorador Abierto de Contrataciones y Alertas IA</span>
                </h2>
                <p className="text-sm text-on-surface-variant">
                  Mostrando{" "}
                  <span className="font-mono font-bold text-primary">
                    {(tendersData?.total || 0).toLocaleString("es-DO")}
                  </span>{" "}
                  contratos auditados · Volumen filtrado:{" "}
                  <span className="font-mono font-bold text-on-surface">
                    RD${" "}
                    {(tendersData?.total_amount_filtered || 0).toLocaleString("es-DO", {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportTendersToCsv(items)}
                  disabled={items.length === 0}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-primary/10 border border-outline-variant/30 text-xs font-bold text-on-surface cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-primary" />
                  <span>Exportar CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportTendersToJson(items)}
                  disabled={items.length === 0}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-primary/10 border border-outline-variant/30 text-xs font-bold text-on-surface cursor-pointer disabled:opacity-50"
                >
                  <FileJson className="w-4 h-4 text-primary" />
                  <span>Exportar JSON</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-outline block mb-1">
                  Institución del Estado
                </label>
                <select
                  value={institutionId ?? ""}
                  onChange={(e) => {
                    setInstitutionId(e.target.value ? Number(e.target.value) : undefined)
                    setPage(1)
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface focus:outline-none focus:border-primary"
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
                <label className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 w-full cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyWithAnomalies}
                    onChange={(e) => {
                      setOnlyWithAnomalies(e.target.checked)
                      setPage(1)
                    }}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-error" />
                    Solo contratos con alertas de IA
                  </span>
                </label>
              </div>

              <div className="flex items-end justify-end">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-highest border border-outline-variant/30 text-xs font-bold text-outline hover:text-on-surface cursor-pointer"
                >
                  Restablecer filtros
                </button>
              </div>
            </div>

            {tendersLoading ? (
              <div className="py-16 text-center text-outline">Consultando registros públicos OCDS...</div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <p className="text-base text-on-surface-variant">
                  No se encontraron contrataciones con los filtros aplicados.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold cursor-pointer"
                >
                  Ver todas las contrataciones
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-surface-container-low hover:bg-surface-container-highest/60 border border-outline-variant/25 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary font-mono text-xs font-bold">
                          {item.dgcp_code}
                        </span>
                        <span className="text-xs font-mono text-outline">
                          Contrato: {item.contract_code}
                        </span>
                        {item.anomaly_count > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full bg-error/15 text-error text-xs font-bold inline-flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {item.anomaly_count} Alerta(s) IA · Sev {item.max_severity}%
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate(`/public/process/${item.id}`)}
                        className="text-left text-base font-bold text-on-surface hover:text-primary transition-colors line-clamp-1 cursor-pointer"
                      >
                        {item.title}
                      </button>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant">
                        {item.institution_id ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/public/institution/${item.institution_id}`)}
                            className="inline-flex items-center gap-1 hover:text-primary font-medium cursor-pointer"
                          >
                            <Building2 className="w-3.5 h-3.5 text-primary" />
                            <span>{item.institution_name}</span>
                          </button>
                        ) : (
                          <span>{item.institution_name}</span>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/public/supplier/${encodeURIComponent(
                                item.supplier_rpe !== "N/A" ? item.supplier_rpe : item.supplier_name,
                              )}`,
                            )
                          }
                          className="inline-flex items-center gap-1 hover:text-primary font-medium cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-sky-500" />
                          <span>
                            {item.supplier_name} (RPE: {item.supplier_rpe})
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] uppercase tracking-wider text-outline block">
                          Monto Adjudicado
                        </span>
                        <span className="text-lg font-mono font-bold text-on-surface">
                          RD${" "}
                          {item.amount_adjudicated.toLocaleString("es-DO", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/public/process/${item.id}`)}
                        className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-90 cursor-pointer"
                      >
                        Ver Ficha OCDS
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
                    className="px-3.5 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-bold disabled:opacity-40 cursor-pointer"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3.5 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-bold disabled:opacity-40 cursor-pointer"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </section>
        </SectionContainer>
      </main>

      <Footer />
    </div>
  )
}