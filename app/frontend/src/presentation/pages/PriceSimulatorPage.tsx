import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import {
  AlertTriangle,
  CheckCircle2,
  Scale,
  ArrowUpRight,
  Sparkles,
} from "lucide-react"
import { useSimulatorCatalog, useSimulatePrice } from "../hooks/useB2BSuite"
import type { PriceSimulationResponse } from "../hooks/useB2BSuite"
import { ProcessInspectorDrawer } from "../components/ConsoleInspectorDrawers"

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

export default function PriceSimulatorPage() {
  const [searchParams] = useSearchParams()
  const initialFam = searchParams.get("unspsc") || "7214"
  const initialAmt = Number(searchParams.get("amt") || 0)

  const [selectedFamily, setSelectedFamily] = useState(initialFam)
  const [proposedPrice, setProposedPrice] = useState<number>(
    initialAmt > 0 && initialAmt < 500000 ? initialAmt : 4500
  )
  const [quantity, setQuantity] = useState<number>(100)
  const [simulationResult, setSimulationResult] = useState<PriceSimulationResponse | null>(null)
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null)

  const { data: catalog } = useSimulatorCatalog()
  const simulateMutation = useSimulatePrice()

  const handleSimulate = async (famOverride?: string, priceOverride?: number) => {
    const fam = famOverride || selectedFamily
    const price = priceOverride ?? proposedPrice
    if (price <= 0 || quantity <= 0) return
    try {
      const res = await simulateMutation.mutateAsync({
        unspsc_family: fam,
        proposed_unit_price_dop: price,
        quantity: quantity,
      })
      setSimulationResult(res)
    } catch {
      // handled by UI
    }
  }

  useEffect(() => {
    void handleSimulate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFamilySelect = (newFam: string) => {
    setSelectedFamily(newFam)
    void handleSimulate(newFam, proposedPrice)
  }

  const dist = simulationResult?.distribution
  const refContracts = simulationResult?.reference_contracts || []

  const getMarkerPercent = () => {
    if (!dist || !simulationResult) return 50
    const min = dist.min_dop
    const max = dist.max_dop
    if (max <= min) return 50
    const raw = ((simulationResult.proposed_unit_price_dop - min) / (max - min)) * 100
    return Math.max(4, Math.min(96, Math.round(raw)))
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 sm:p-8 max-w-[80rem] mx-auto space-y-6">
          {/* Clean Header + Selector matching MarketIntelligencePage */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-on-surface">
                Simulador de Precios e Índice de Competitividad
              </h1>
              <p className="text-xs text-on-surface-variant mt-1">
                Modelado estadístico frente a cuartiles históricos adjudicados (P25, Mediana P50, P75) y umbrales de la Ley 340-06.
              </p>
            </div>

            <div className="w-full lg:w-[440px]">
              <label
                htmlFor="simulator-family-select"
                className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5"
              >
                Rubro del Clasificador UNSPSC
              </label>
              <select
                id="simulator-family-select"
                value={selectedFamily}
                onChange={(e) => handleFamilySelect(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container-high border border-outline-variant text-xs font-semibold text-on-surface focus:outline-none focus:border-primary cursor-pointer"
              >
                {(catalog || []).map((c) => (
                  <option key={c.unspsc_family} value={c.unspsc_family}>
                    {c.label} ({c.samples_count} muestras · {c.unit_label})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4 KPI Cards when simulationResult is available */}
          {simulationResult && dist && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-primary rounded-2xl p-5 flex flex-col justify-between shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Índice de Competitividad
                </span>
                <div className="mt-2.5 space-y-1">
                  <p className="font-mono text-2xl font-bold text-primary tracking-tight">
                    {simulationResult.competitiveness_index} / 100
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {simulationResult.risk_band_label}
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-emerald-500 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Probabilidad de Adjudicación
                </span>
                <div className="mt-2.5 space-y-1">
                  <p className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                    {simulationResult.win_probability_pct}%
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Frente a {simulationResult.sample_size} adjudicaciones del rubro
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-outline-variant rounded-2xl p-5 flex flex-col justify-between shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Desviación vs. Mediana (P50)
                </span>
                <div className="mt-2.5 space-y-1">
                  <p className="font-mono text-2xl font-bold text-on-surface tracking-tight">
                    {simulationResult.deviation_vs_median_pct > 0
                      ? `+${simulationResult.deviation_vs_median_pct}%`
                      : `${simulationResult.deviation_vs_median_pct}%`}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Mediana: {formatDop(dist.median_p50_dop)}
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-primary rounded-2xl p-5 flex flex-col justify-between shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Monto Total Simulado
                </span>
                <div className="mt-2.5 space-y-1">
                  <p className="font-mono text-2xl font-bold text-on-surface tracking-tight">
                    {formatCompactDop(simulationResult.projected_total_dop)}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {simulationResult.quantity.toLocaleString("es-DO")} unidades ×{" "}
                    {formatDop(simulationResult.proposed_unit_price_dop)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2-Column Layout matching MarketIntelligencePage */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Parámetros de Oferta (5 cols) */}
            <div className="lg:col-span-5 bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-6 space-y-5 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h2 className="font-display text-base font-bold text-on-surface">
                    Parámetros de la Oferta Económica
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Ajuste su precio unitario y cantidad para recalcular su posición competitiva
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Precio Unitario Propuesto (RD$)
                  </label>
                  <input
                    type="number"
                    min={1}
                    step="any"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/35 text-sm font-mono font-bold text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Cantidad de Unidades a Ofertar
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/35 text-xs font-mono font-bold text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                {dist && (
                  <div className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/25 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
                      Atajos de Calibración Rápida
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setProposedPrice(dist.p25_dop)
                          void handleSimulate(selectedFamily, dist.p25_dop)
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-surface border border-outline-variant/35 text-xs font-mono font-semibold text-on-surface hover:border-primary cursor-pointer"
                      >
                        Usar P25 ({formatDop(dist.p25_dop)})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProposedPrice(dist.median_p50_dop)
                          void handleSimulate(selectedFamily, dist.median_p50_dop)
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-surface border border-outline-variant/35 text-xs font-mono font-semibold text-primary hover:border-primary cursor-pointer"
                      >
                        Usar Mediana P50 ({formatDop(dist.median_p50_dop)})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProposedPrice(dist.p75_dop)
                          void handleSimulate(selectedFamily, dist.p75_dop)
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-surface border border-outline-variant/35 text-xs font-mono font-semibold text-on-surface hover:border-primary cursor-pointer"
                      >
                        Usar P75 ({formatDop(dist.p75_dop)})
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => void handleSimulate()}
                disabled={simulateMutation.isPending || proposedPrice <= 0}
                className="w-full h-11 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-95 transition-opacity flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {simulateMutation.isPending
                    ? "Calculando cuartiles..."
                    : "Ejecutar Simulación Estadística"}
                </span>
              </button>
            </div>

            {/* Right: Termómetro de Cuartiles + Dictamen Ley 340-06 (7 cols) */}
            <div className="lg:col-span-7 bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-6 space-y-5 shadow-xs flex flex-col justify-between">
              <div>
                <h2 className="font-display text-base font-bold text-on-surface">
                  Posicionamiento en Cuartiles del Sector ({simulationResult?.unit_label || "Unidad"})
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Ubicación de su oferta frente a la banda competitiva ganadora P25 – P75
                </p>
              </div>

              {simulationResult && dist && (
                <>
                  {/* Regla visual de cuartiles */}
                  <div className="space-y-4">
                    <div className="relative h-9 rounded-xl bg-surface-container-high overflow-hidden flex border border-outline-variant/30">
                      <div
                        className="h-full bg-amber-500/20 border-r border-amber-500/30 flex items-center justify-center text-[10px] font-bold text-amber-700 dark:text-amber-300"
                        style={{ width: "25%" }}
                      >
                        &lt; P25
                      </div>
                      <div
                        className="h-full bg-emerald-500/20 border-r border-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-800 dark:text-emerald-300"
                        style={{ width: "50%" }}
                      >
                        Banda Óptima Ganadora (P25 – P75)
                      </div>
                      <div
                        className="h-full bg-red-500/20 flex items-center justify-center text-[10px] font-bold text-red-700 dark:text-red-300"
                        style={{ width: "25%" }}
                      >
                        &gt; P75
                      </div>

                      {/* Indicador de precio propuesto */}
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-primary shadow-md transition-all duration-300"
                        style={{ left: `${getMarkerPercent()}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-5 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/25">
                        <p className="text-[10px] text-on-surface-variant uppercase font-bold">Mínimo</p>
                        <p className="font-mono text-xs font-bold text-on-surface mt-0.5">
                          {formatDop(dist.min_dop)}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                        <p className="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase font-bold">
                          Cuartil P25
                        </p>
                        <p className="font-mono text-xs font-bold text-on-surface mt-0.5">
                          {formatDop(dist.p25_dop)}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/25">
                        <p className="text-[10px] text-primary uppercase font-bold">Mediana P50</p>
                        <p className="font-mono text-xs font-bold text-primary mt-0.5">
                          {formatDop(dist.median_p50_dop)}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                        <p className="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase font-bold">
                          Cuartil P75
                        </p>
                        <p className="font-mono text-xs font-bold text-on-surface mt-0.5">
                          {formatDop(dist.p75_dop)}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/25">
                        <p className="text-[10px] text-on-surface-variant uppercase font-bold">Máximo</p>
                        <p className="font-mono text-xs font-bold text-on-surface mt-0.5">
                          {formatDop(dist.max_dop)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dictamen Técnico-Normativo Ley 340-06 */}
                  <div
                    className={`p-4 rounded-xl border space-y-1.5 ${
                      simulationResult.risk_band === "OPTIMA_COMPETITIVA"
                        ? "bg-emerald-500/10 border-emerald-500/25"
                        : simulationResult.risk_band === "ZONA_MEDIA_MERCADO"
                          ? "bg-primary/10 border-primary/25"
                          : "bg-amber-500/10 border-amber-500/25"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
                      {simulationResult.risk_band === "OPTIMA_COMPETITIVA" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : simulationResult.risk_band === "ZONA_MEDIA_MERCADO" ? (
                        <Scale className="w-4 h-4 text-primary shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      )}
                      <span>Dictamen Preventivo (Ley 340-06 y Reglamento 416-23): {simulationResult.risk_band_label}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {simulationResult.legal_advisory}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Contratos Históricos de Referencia — Full Width Table */}
          {simulationResult && (
            <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant/25 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="font-display text-base font-bold text-on-surface">
                    Contratos Históricos de Referencia en el Rubro {simulationResult.unspsc_family}
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Adjudicaciones utilizadas como base estadística para el cálculo de cuartiles
                  </p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-surface-container-high text-xs font-mono font-semibold text-on-surface shrink-0">
                  {refContracts.length} referencias
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/25 bg-surface-container-low/60 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                      <th className="py-3 px-5">Proceso</th>
                      <th className="py-3 px-5">Proveedor Adjudicado</th>
                      <th className="py-3 px-5">Institución Compradora</th>
                      <th className="py-3 px-5 text-right">Precio Unitario</th>
                      <th className="py-3 px-5 text-right">Monto Contrato</th>
                      <th className="py-3 px-5 text-right">Expediente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20 text-xs">
                    {refContracts.map((rc, idx) => (
                      <tr
                        key={`${rc.process_code}-${idx}`}
                        className="hover:bg-surface-container-low/50 transition-colors"
                      >
                        <td className="py-3.5 px-5 font-mono font-semibold text-primary whitespace-nowrap">
                          {rc.process_code}
                          <span className="block text-[11px] font-normal text-on-surface-variant">
                            {rc.signed_date}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 font-medium text-on-surface max-w-[240px] truncate">
                          {rc.supplier_name}
                        </td>
                        <td className="py-3.5 px-5 text-on-surface-variant max-w-[240px] truncate">
                          {rc.institution_name}
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono font-bold text-primary whitespace-nowrap">
                          {formatDop(rc.unit_price_dop)}
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono font-bold text-on-surface whitespace-nowrap">
                          {formatDop(rc.total_amount_dop)}
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedProcessId(rc.process_id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 text-xs font-semibold text-on-surface transition-colors cursor-pointer"
                          >
                            <span>Expediente</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
