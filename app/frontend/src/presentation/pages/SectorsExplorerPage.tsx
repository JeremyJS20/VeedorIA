import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search,
  CheckCircle2,
  Plus,
  Calculator,
  Compass,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react"
import { useSectors, useUpdateMonitoredSectors } from "../hooks/useB2BSuite"

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

export default function SectorsExplorerPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data, isLoading } = useSectors()
  const updateSectorsMutation = useUpdateMonitoredSectors()

  const monitored = data?.monitored_families || []
  const maxAllowed = data?.max_families_allowed || 3
  const isPyme = maxAllowed <= 3
  const sectors = data?.sectors || []

  const handleToggleSector = async (famCode: string) => {
    setErrorMessage(null)
    const isCurrentlyMonitored = monitored.includes(famCode)
    let nextList: string[]

    if (isCurrentlyMonitored) {
      if (monitored.length <= 1) {
        setErrorMessage("Debe mantener al menos 1 rubro UNSPSC monitoreado para alimentar su Radar de Oportunidades.")
        return
      }
      nextList = monitored.filter((c) => c !== famCode)
    } else {
      if (isPyme && monitored.length >= maxAllowed) {
        setErrorMessage(
          `Su plan actual permite monitorear hasta ${maxAllowed} rubros UNSPSC simultáneos. Actualice a Plan Corporativo para monitoreo ilimitado.`
        )
        return
      }
      nextList = [...monitored, famCode]
    }

    try {
      await updateSectorsMutation.mutateAsync(nextList)
    } catch {
      setErrorMessage("No fue posible actualizar los rubros monitoreados. Verifique el límite de su suscripción.")
    }
  }

  const filteredSectors = sectors.filter(
    (s) =>
      !searchTerm ||
      s.unspsc_family.includes(searchTerm) ||
      s.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.top_institution_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalCatalogVolume = sectors.reduce((acc, s) => acc + (s.total_amount_dop || 0), 0)

  return (
    <div className="p-6 sm:p-8 max-w-[80rem] mx-auto space-y-6">
      {/* Clean Unboxed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">
            Explorador de Sectores y Rubros Monitoreados
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Configure las familias del clasificador UNSPSC que alimentan automáticamente su Radar de Oportunidades B2B.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/app/oportunidades")}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-95 transition-opacity shadow-xs shrink-0 cursor-pointer"
        >
          <span>Ir al Radar de Oportunidades</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3 KPI Cards matching MarketIntelligencePage */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-primary rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Cuota de Rubros Monitoreados
          </span>
          <div className="mt-2.5 space-y-1">
            <p className="font-mono text-2xl font-bold text-on-surface tracking-tight">
              {monitored.length} / {isPyme ? maxAllowed : "Ilimitados"}
            </p>
            <p className="text-xs text-on-surface-variant">
              Familias UNSPSC con alertas activas
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-outline-variant rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Familias en Catálogo Analítico
          </span>
          <div className="mt-2.5 space-y-1">
            <p className="font-mono text-2xl font-bold text-on-surface tracking-tight">
              {sectors.length} Rubros
            </p>
            <p className="text-xs text-on-surface-variant">
              Clasificador estándar de compras públicas
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-primary rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Volumen Contratado en Catálogo
          </span>
          <div className="mt-2.5 space-y-1">
            <p className="font-mono text-2xl font-bold text-primary tracking-tight">
              {formatCompactDop(totalCatalogVolume)}
            </p>
            <p className="text-xs text-on-surface-variant">
              Adjudicaciones históricas consolidadas
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300 font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          {isPyme && (
            <button
              type="button"
              onClick={() => navigate("/app/suscripcion")}
              className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold shrink-0 cursor-pointer"
            >
              Ampliar Plan
            </button>
          )}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por código de familia UNSPSC, nombre del sector o segmento comercial..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface-container-low border border-outline-variant/35 text-xs text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-primary"
          />
        </div>
        <span className="px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-mono font-semibold text-on-surface shrink-0">
          Mostrando {filteredSectors.length} rubros
        </span>
      </div>

      {/* Grid of Sector Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-48 rounded-2xl bg-surface-container-low animate-pulse border border-outline-variant/25"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSectors.map((sector) => {
            const active = monitored.includes(sector.unspsc_family)
            return (
              <div
                key={sector.unspsc_family}
                className={`bg-surface-container-lowest dark:bg-surface-container border rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-xs transition-all ${
                  active
                    ? "border-primary/50 border-l-4 border-l-primary"
                    : "border-outline-variant/35"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-surface-container-high font-mono text-[11px] font-bold text-primary">
                        UNSPSC {sector.unspsc_family} · Competencia {sector.competition_density}
                      </span>
                      <h2 className="font-display text-base font-bold text-on-surface mt-1.5">
                        {sector.label}
                      </h2>
                    </div>

                    <button
                      type="button"
                      disabled={updateSectorsMutation.isPending}
                      onClick={() => void handleToggleSector(sector.unspsc_family)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                        active
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                          : "bg-surface-container-low hover:bg-primary/10 text-on-surface hover:text-primary border border-outline-variant/35"
                      }`}
                    >
                      {active ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Monitoreado</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Monitorear</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-on-surface-variant">
                    Principal comprador:{" "}
                    <strong className="text-on-surface">{sector.top_institution_name}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-outline-variant/20">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                      Volumen Sector
                    </span>
                    <span className="font-mono text-sm font-bold text-primary mt-0.5 block">
                      {formatCompactDop(sector.total_amount_dop)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                      Contratos
                    </span>
                    <span className="font-mono text-sm font-bold text-on-surface mt-0.5 block">
                      {sector.total_contracts.toLocaleString("es-DO")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                      Mediana Unitaria
                    </span>
                    <span className="font-mono text-sm font-bold text-on-surface mt-0.5 block">
                      {formatDop(sector.median_unit_price_dop)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => navigate(`/app/oportunidades`)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 text-xs font-semibold text-on-surface transition-colors cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5 text-primary" />
                    <span>Ver en Radar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/app/simulador-precios?unspsc=${sector.unspsc_family}&amt=${sector.median_unit_price_dop}`
                      )
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 text-xs font-semibold text-on-surface transition-colors cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5 text-primary" />
                    <span>Simular Precio</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
