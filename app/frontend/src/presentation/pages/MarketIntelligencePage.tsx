import { useState } from "react"
import {
  TrendingUp,
  Building2,
  Award,
  BarChart3,
  Lock,
  Layers,
  Calendar,
  FileText,
} from "lucide-react"
import { useMarketIntelligence } from "../hooks/useAuthManagement"

function formatDop(amount: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

function formatCompactDop(amount: number): string {
  const v = amount || 0
  if (v >= 1_000_000_000) return `RD$ ${(v / 1_000_000_000).toFixed(2)}B`
  if (v >= 1_000_000) return `RD$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `RD$ ${(v / 1_000).toFixed(1)}K`
  return `RD$ ${v.toFixed(0)}`
}

export default function MarketIntelligencePage() {
  const [selectedCode, setSelectedCode] = useState<string | undefined>(undefined)
  const { data: market, isLoading } = useMarketIntelligence(selectedCode)

  const families = market?.available_families || []
  const currentFamily = market?.selected_family
  const priceTrend = market?.price_trend || []
  const maxTrendPrice = Math.max(...priceTrend.map((p) => p.avg_unit_price), 1)
  const wpr = market?.winning_price_range

  return (
    <div className="w-full max-w-[80rem] mx-auto px-6 py-6 space-y-6">
      {/* Header + UNSPSC Selector */}
      <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-xs">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Inteligencia Comercial de Contrataciones Públicas</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-on-surface">
            Consola de Inteligencia de Mercado por Rubro
          </h1>
          <p className="text-xs text-on-surface-variant">
            Analice precios unitarios históricos, participación de competidores e instituciones compradoras por clasificador UNSPSC.
          </p>
        </div>

        <div className="w-full lg:w-[420px]">
          <label
            htmlFor="unspsc-family-select"
            className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5"
          >
            Rubro del Clasificador UNSPSC
          </label>
          <select
            id="unspsc-family-select"
            value={currentFamily?.code || ""}
            onChange={(e) => setSelectedCode(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container-high border border-outline-variant text-xs font-semibold text-on-surface focus:outline-none focus:border-primary cursor-pointer"
          >
            {families.map((fam) => (
              <option key={fam.code} value={fam.code}>
                {fam.label} ({fam.total_contracts} contratos)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Family Summary Bar */}
      {currentFamily && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Contratos en el Rubro {currentFamily.code}
              </p>
              <p className="font-mono text-xl font-bold text-on-surface mt-1">
                {currentFamily.total_contracts.toLocaleString("es-DO")} Contratos
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Líneas de Artículos Analizadas
              </p>
              <p className="font-mono text-xl font-bold text-on-surface mt-1">
                {currentFamily.total_items.toLocaleString("es-DO")} Ítems
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Volumen Total Adjudicado
              </p>
              <p className="font-mono text-xl font-bold text-primary mt-1">
                {formatCompactDop(currentFamily.total_amount_dop)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Main Content: 2x2 Analytics Grid + 320px Right Sidebar */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-64 rounded-2xl bg-surface-container-low animate-pulse border border-outline-variant/25"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col xl:flex-row gap-6 items-start">
          {/* Left 2x2 Grid */}
          <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Panel 1: Historical Unit Price Trend */}
            <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-sm font-bold text-on-surface">
                    1. Tendencia Histórica de Precios Unitarios
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Evolución trimestral del precio unitario promedio adjudicado
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-surface-container-high text-[11px] font-mono font-semibold text-on-surface">
                  Ventana: {market?.history_months_limit || 60} meses
                </span>
              </div>

              <div className="space-y-3 pt-1">
                {priceTrend.map((pt) => {
                  const pct = Math.max(12, Math.round((pt.avg_unit_price / maxTrendPrice) * 100))
                  return (
                    <div key={pt.period} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-semibold text-on-surface">{pt.period}</span>
                        <span className="font-mono text-on-surface-variant">
                          {formatDop(pt.avg_unit_price)} · {pt.contracts_count} adj.
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-surface-container-high overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Panel 2: Supplier Market Share */}
            <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-sm font-bold text-on-surface">
                    2. Distribución de Adjudicaciones por Proveedor
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Principales empresas adjudicatarias dentro del rubro activo
                  </p>
                </div>
                <Award className="w-4 h-4 text-primary shrink-0" />
              </div>

              {market?.supplier_share.locked ? (
                <div className="py-10 px-4 rounded-xl bg-surface-container-low border border-outline-variant/30 text-center space-y-2">
                  <Lock className="w-6 h-6 text-amber-600 mx-auto" />
                  <p className="text-xs font-bold text-on-surface">
                    Análisis de Competidores Restringido
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Actualice al{" "}
                    <span className="font-semibold text-primary">
                      {market.supplier_share.required_plan_label}
                    </span>{" "}
                    para desbloquear la cuota de mercado y RPE de sus competidores.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(market?.supplier_share.items || []).map((sup) => (
                    <div key={`${sup.rpe}-${sup.supplier_name}`} className="space-y-1">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="font-semibold text-on-surface truncate">
                          {sup.supplier_name}
                        </span>
                        <span className="font-mono font-bold text-primary shrink-0">
                          {sup.share_pct}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-mono">
                        <span>
                          RPE #{sup.rpe} · {sup.contracts_won} adjudicaciones
                        </span>
                        <span>{formatCompactDop(sup.amount_dop)}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, Math.max(8, sup.share_pct))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Panel 3: Winning Price Range (P25 - Median - P75) */}
            <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-sm font-bold text-on-surface">
                    3. Rango de Precios Adjudicados con Mayor Éxito
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Banda estadística de precios ganadores ({wpr?.unit_label || "Unidad"})
                  </p>
                </div>
                <BarChart3 className="w-4 h-4 text-primary shrink-0" />
              </div>

              {wpr?.locked ? (
                <div className="py-10 px-4 rounded-xl bg-surface-container-low border border-outline-variant/30 text-center space-y-2">
                  <Lock className="w-6 h-6 text-amber-600 mx-auto" />
                  <p className="text-xs font-bold text-on-surface">
                    Banda Óptima de Precios Restringida
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Disponible en{" "}
                    <span className="font-semibold text-primary">{wpr.required_plan_label}</span>{" "}
                    para simular ofertas competitivas.
                  </p>
                </div>
              ) : (
                wpr && (
                  <div className="space-y-4 pt-1">
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                          Franja Competitiva Recomendada (P25 – P75)
                        </p>
                        <p className="font-mono text-base font-bold text-on-surface mt-0.5">
                          {formatDop(wpr.p25_price_dop)} — {formatDop(wpr.p75_price_dop)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-on-surface-variant">Mediana Ganadora</p>
                        <p className="font-mono text-sm font-bold text-primary">
                          {formatDop(wpr.median_price_dop)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/25">
                        <p className="text-[11px] text-on-surface-variant">Mínimo</p>
                        <p className="font-mono text-xs font-bold text-on-surface mt-0.5">
                          {formatDop(wpr.min_price_dop)}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/25">
                        <p className="text-[11px] text-on-surface-variant">Promedio</p>
                        <p className="font-mono text-xs font-bold text-on-surface mt-0.5">
                          {formatDop(wpr.avg_price_dop)}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/25">
                        <p className="text-[11px] text-on-surface-variant">Máximo</p>
                        <p className="font-mono text-xs font-bold text-on-surface mt-0.5">
                          {formatDop(wpr.max_price_dop)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Panel 4: Top Buying Institutions */}
            <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-sm font-bold text-on-surface">
                    4. Principales Instituciones Compradoras
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Unidades de compra con mayor demanda en este rubro UNSPSC
                  </p>
                </div>
                <Building2 className="w-4 h-4 text-primary shrink-0" />
              </div>

              <div className="space-y-2.5">
                {(market?.top_institutions || []).map((inst, idx) => (
                  <div
                    key={`${inst.institution_id}-${idx}`}
                    className="p-3 rounded-xl bg-surface-container-low/70 border border-outline-variant/25 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-on-surface truncate">
                        {inst.institution_name}
                      </p>
                      <p className="text-[11px] text-on-surface-variant font-mono">
                        {inst.contracts_count} adjudicaciones registradas
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold text-primary shrink-0">
                      {formatCompactDop(inst.total_amount_dop)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar (320px): Recent Sector Processes */}
          <aside className="w-full xl:w-[320px] shrink-0 bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-outline-variant/25 pb-3">
              <div>
                <h2 className="font-display text-sm font-bold text-on-surface flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>Procesos Recientes del Sector</span>
                </h2>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Últimas adjudicaciones del rubro activo
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {(market?.recent_processes || []).map((proc) => (
                <div
                  key={proc.process_code}
                  className="p-3 rounded-xl bg-surface-container-low/70 border border-outline-variant/25 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-primary truncate max-w-[180px]">
                      {proc.process_code}
                    </span>
                    <span className="text-on-surface-variant inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {proc.signed_date}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-on-surface line-clamp-2 leading-snug">
                    {proc.title}
                  </p>
                  <p className="text-[11px] text-on-surface-variant truncate">
                    {proc.institution_name}
                  </p>
                  <div className="pt-1 border-t border-outline-variant/20 flex items-center justify-between text-[11px]">
                    <span className="text-on-surface-variant truncate max-w-[160px]">
                      {proc.supplier_name}
                    </span>
                    <span className="font-mono font-bold text-on-surface">
                      {formatCompactDop(proc.amount_dop)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}