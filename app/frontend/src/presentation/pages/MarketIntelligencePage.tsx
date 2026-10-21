import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Lock, Calendar } from "lucide-react"
import { useMarketIntelligence } from "../hooks/useAuthManagement"
import { useAuth } from "../context/AuthContext"
import { resolvePlanLock } from "../../domain/previewProfiles"
import DataTable from "../components/ui/DataTable"
import KpiCard from "../components/ui/KpiCard"

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
  const [searchParams] = useSearchParams()
  const activeSection = (searchParams.get("seccion") || "precios") as
    | "precios"
    | "competidores"
    | "procesos"

  const [selectedCode, setSelectedCode] = useState<string | undefined>(undefined)
  const { data: market, isLoading } = useMarketIntelligence(selectedCode)

  const families = market?.available_families || []
  const currentFamily = market?.selected_family
  const priceTrend = market?.price_trend || []
  const maxTrendPrice = Math.max(...priceTrend.map((p) => p.avg_unit_price), 1)
  const wpr = market?.winning_price_range

  const { user, isPreviewing } = useAuth()
  const priceBandLocked = resolvePlanLock(Boolean(wpr?.locked), "market_advanced", {
    isPreviewing,
    planTier: user?.tenant?.plan_tier,
  })
  const supplierShareLocked = resolvePlanLock(
    Boolean(market?.supplier_share.locked),
    "market_advanced",
    { isPreviewing, planTier: user?.tenant?.plan_tier }
  )

  const sectionMeta = {
    precios: {
      title: "Precios e Histórico por Rubro",
      subtitle:
        "Evolución trimestral del precio unitario adjudicado y franja estadística de ofertas ganadoras.",
    },
    competidores: {
      title: "Competidores y Compradores del Rubro",
      subtitle:
        "Participación de mercado por empresa adjudicataria y principales instituciones públicas compradoras.",
    },
    procesos: {
      title: "Adjudicaciones Recientes del Sector",
      subtitle:
        "Contratos y procesos registrados recientemente dentro de la familia del clasificador UNSPSC.",
    },
  }[activeSection] || {
    title: "Inteligencia de Mercado por Rubro",
    subtitle: "Análisis comercial por clasificador UNSPSC.",
  }

  return (
    <div className="p-6 sm:p-8 max-w-[80rem] mx-auto space-y-6">
      {/* Clean Header + UNSPSC Selector */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">
            {sectionMeta.title}
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            {sectionMeta.subtitle}
          </p>
        </div>

        <div className="w-full lg:w-[440px]">
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

      {/* Selected Family 3 Summary KPI Cards */}
      {currentFamily && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label={`Contratos en el Rubro ${currentFamily.code}`}
            value={`${currentFamily.total_contracts.toLocaleString("es-DO")} Contratos`}
          />
          <KpiCard
            label="Líneas de Artículos Analizadas"
            value={`${currentFamily.total_items.toLocaleString("es-DO")} Ítems`}
            accent="neutral"
          />
          <KpiCard
            label="Volumen Total Adjudicado"
            value={formatCompactDop(currentFamily.total_amount_dop)}
            valueClassName="text-primary"
          />
        </div>
      )}

      {/* Subsection Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-72 rounded-2xl bg-surface-container-low animate-pulse border border-outline-variant/25"
            />
          ))}
        </div>
      ) : activeSection === "precios" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Historical Unit Price Trend */}
          <div className="lg:col-span-7 bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-6 space-y-5 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-bold text-on-surface">
                  Tendencia Histórica de Precios Unitarios
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Evolución trimestral del precio unitario promedio adjudicado en este rubro
                </p>
              </div>
              <span className="px-3 py-1 rounded-lg bg-surface-container-high text-xs font-mono font-semibold text-on-surface shrink-0">
                Ventana: {market?.history_months_limit || 60} meses
              </span>
            </div>

            <div className="space-y-4 pt-2">
              {priceTrend.map((pt) => {
                const pct = Math.max(12, Math.round((pt.avg_unit_price / maxTrendPrice) * 100))
                return (
                  <div key={pt.period} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-on-surface">{pt.period}</span>
                      <span className="font-mono text-on-surface-variant">
                        <strong className="text-on-surface">{formatDop(pt.avg_unit_price)}</strong> ·{" "}
                        {pt.contracts_count} adjudicaciones
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-surface-container-high overflow-hidden">
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

          {/* Right: Winning Price Range (P25 - Median - P75) */}
          <div className="lg:col-span-5 bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-6 space-y-5 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-on-surface">
                Rango de Precios Adjudicados con Mayor Éxito
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Banda estadística de precios ganadores ({wpr?.unit_label || "Unidad Adjudicada"})
              </p>
            </div>

            {priceBandLocked ? (
              <div className="py-12 px-5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-center space-y-2">
                <Lock className="w-6 h-6 text-amber-600 mx-auto" />
                <p className="text-xs font-bold text-on-surface">
                  Banda Óptima de Precios Restringida
                </p>
                <p className="text-xs text-on-surface-variant">
                  Disponible en{" "}
                  <span className="font-semibold text-primary">{wpr?.required_plan_label ?? "Plan Proveedor Corporativo"}</span>{" "}
                  para simular ofertas competitivas.
                </p>
              </div>
            ) : (
              wpr && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      Franja Competitiva Recomendada (P25 – P75)
                    </p>
                    <p className="font-mono text-xl font-bold text-on-surface">
                      {formatDop(wpr.p25_price_dop)} — {formatDop(wpr.p75_price_dop)}
                    </p>
                    <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant">Mediana Ganadora (P50)</span>
                      <span className="font-mono font-bold text-primary">
                        {formatDop(wpr.median_price_dop)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/25">
                      <p className="text-[11px] text-on-surface-variant">Mínimo</p>
                      <p className="font-mono text-xs font-bold text-on-surface mt-1">
                        {formatDop(wpr.min_price_dop)}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/25">
                      <p className="text-[11px] text-on-surface-variant">Promedio</p>
                      <p className="font-mono text-xs font-bold text-on-surface mt-1">
                        {formatDop(wpr.avg_price_dop)}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/25">
                      <p className="text-[11px] text-on-surface-variant">Máximo</p>
                      <p className="font-mono text-xs font-bold text-on-surface mt-1">
                        {formatDop(wpr.max_price_dop)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      ) : activeSection === "competidores" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Supplier Market Share */}
          <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-6 space-y-5 shadow-xs">
            <div>
              <h2 className="font-display text-base font-bold text-on-surface">
                Distribución de Adjudicaciones por Proveedor
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Principales empresas adjudicatarias dentro del rubro activo
              </p>
            </div>

            {supplierShareLocked ? (
              <div className="py-12 px-5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-center space-y-2">
                <Lock className="w-6 h-6 text-amber-600 mx-auto" />
                <p className="text-xs font-bold text-on-surface">
                  Análisis de Competidores Restringido
                </p>
                <p className="text-xs text-on-surface-variant">
                  Actualice al{" "}
                  <span className="font-semibold text-primary">
                    {market?.supplier_share.required_plan_label ?? "Plan Proveedor Corporativo"}
                  </span>{" "}
                  para desbloquear la cuota de mercado y RPE de sus competidores.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {(market?.supplier_share.items || []).map((sup) => (
                  <div
                    key={`${sup.rpe}-${sup.supplier_name}`}
                    className="p-3.5 rounded-xl bg-surface-container-low/60 border border-outline-variant/25 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-bold text-on-surface truncate">
                        {sup.supplier_name}
                      </span>
                      <span className="font-mono font-bold text-primary shrink-0">
                        {sup.share_pct}% del rubro
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-mono">
                      <span>
                        RPE #{sup.rpe} · {sup.contracts_won} adjudicaciones
                      </span>
                      <span className="font-semibold text-on-surface">
                        {formatCompactDop(sup.amount_dop)}
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-surface-container-high overflow-hidden">
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

          {/* Right: Top Buying Institutions */}
          <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-6 space-y-5 shadow-xs">
            <div>
              <h2 className="font-display text-base font-bold text-on-surface">
                Principales Instituciones Compradoras
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Unidades de compra del Estado con mayor volumen contratado en este rubro
              </p>
            </div>

            <div className="space-y-3">
              {(market?.top_institutions || []).map((inst, idx) => (
                <div
                  key={`${inst.institution_id}-${idx}`}
                  className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/25 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-on-surface truncate">
                      {inst.institution_name}
                    </p>
                    <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">
                      {inst.contracts_count} adjudicaciones registradas en el rubro
                    </p>
                  </div>
                  <span className="font-mono text-sm font-bold text-primary shrink-0">
                    {formatCompactDop(inst.total_amount_dop)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Procesos Recientes del Sector — Full Width Table */
        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/25">
            <h2 className="font-display text-base font-bold text-on-surface">
              Procesos y Contratos Recientes del Rubro {currentFamily?.code}
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Adjudicaciones registradas recientemente con su institución compradora y proveedor adjudicado
            </p>
          </div>

          <DataTable
            rows={market?.recent_processes ?? []}
            rowKey={(proc) => proc.process_code}
            emptyMessage="No hay procesos recientes para el rubro seleccionado."
            columns={[
              {
                key: "proceso",
                header: "Código de Proceso",
                cellClassName: "font-mono font-semibold text-primary whitespace-nowrap",
                cell: (proc) => (
                  <>
                    {proc.process_code}
                    <div className="text-[11px] font-normal text-on-surface-variant flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{proc.signed_date}</span>
                    </div>
                  </>
                ),
              },
              {
                key: "objeto",
                header: "Objeto de Contratación",
                cellClassName: "font-medium text-on-surface max-w-[360px]",
                cell: (proc) => <p className="line-clamp-2">{proc.title}</p>,
              },
              {
                key: "institucion",
                header: "Institución Compradora",
                cellClassName: "text-on-surface-variant max-w-[240px] truncate",
                cell: (proc) => proc.institution_name,
              },
              {
                key: "proveedor",
                header: "Proveedor Adjudicado",
                cellClassName: "text-on-surface max-w-[240px] truncate font-medium",
                cell: (proc) => proc.supplier_name,
              },
              {
                key: "monto",
                header: "Monto Adjudicado",
                align: "right",
                cellClassName: "font-mono font-bold text-on-surface whitespace-nowrap",
                cell: (proc) => formatDop(proc.amount_dop),
              },
            ]}
          />
        </div>
      )}
    </div>
  )
}