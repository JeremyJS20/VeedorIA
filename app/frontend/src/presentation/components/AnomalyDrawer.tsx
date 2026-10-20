import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Maximize2, X, Scale, AlertTriangle } from "lucide-react"
import { toast } from "@heroui/react"
import type { Anomaly, DismissalReason } from "../../domain/anomaly"
import { useAnomalyContext, useReviewAnomaly } from "../hooks/useAnomalyQueries"
import Button from "./ui/Button"
import FullscreenOverlay from "./ui/FullscreenOverlay"
import SeverityGauge from "./SeverityGauge"
import PriceScatter from "./PriceScatter"
import FragmentationBarChart from "./FragmentationBarChart"
import CollusionNetwork from "./CollusionNetwork"
import InstitutionTimeline from "./InstitutionTimeline"
import SectionErrorBoundary from "./SectionErrorBoundary"

interface AnomalyDrawerProps {
  anomaly: Anomaly
  onClose: () => void
  className?: string
}

const SIGNAL_CONFIG: Record<string, { label: string; icon: string }> = {
  shared_phone: { label: "Teléfono", icon: "📞" },
  shared_address: { label: "Dirección", icon: "📍" },
  shared_domain: { label: "Dominio de email", icon: "📧" },
  shared_rnc_prefix: { label: "Prefijo RNC", icon: "🔗" },
  similar_name: { label: "Nombre similar", icon: "📛" },
}

function median(values: number[]) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

type FullscreenChart = "price" | "fragmentation" | "collusion" | null

export default function AnomalyDrawer({ anomaly, onClose, className = "" }: AnomalyDrawerProps) {
  const { t } = useTranslation("dashboard")
  const [notes, setNotes] = useState("")
  const [dismissalReason, setDismissalReason] = useState<DismissalReason | "">("")
  const [fullscreenChart, setFullscreenChart] = useState<FullscreenChart>(null)
  const reviewMutation = useReviewAnomaly()
  const { data: ctx, isLoading: ctxLoading } = useAnomalyContext(anomaly.id)
  const reviewerId = localStorage.getItem("user_id") || "00000000-0000-0000-0000-000000000000"

  const DISMISSAL_REASONS: { value: DismissalReason; labelKey: string }[] = [
    { value: "FALSE_POSITIVE", labelKey: "drawer.dismiss_reason_FALSE_POSITIVE" },
    { value: "DUPLICATE", labelKey: "drawer.dismiss_reason_DUPLICATE" },
    { value: "DATA_ERROR", labelKey: "drawer.dismiss_reason_DATA_ERROR" },
    { value: "ALREADY_KNOWN", labelKey: "drawer.dismiss_reason_ALREADY_KNOWN" },
  ]

  const handleReview = async (status: "CONFIRMED" | "DISMISSED") => {
    if (status === "DISMISSED" && !dismissalReason) {
      toast.danger(t("drawer.dismiss_reason_required"))
      return
    }
    if (status === "CONFIRMED" && notes.trim().length < 10) {
      toast.danger(t("drawer.notes_required"))
      return
    }
    toast.success(status === "CONFIRMED" ? "Anomalía confirmada" : "Anomalía descartada")
    try {
      await reviewMutation.mutateAsync({
        id: anomaly.id,
        payload: {
          status,
          reviewer_id: reviewerId,
          notes: notes.trim() || undefined,
          dismissal_reason: dismissalReason || undefined,
        },
      })
      onClose()
    } catch {
      // error handled by mutation
    }
  }

  const marketPrices = ctx?.market_prices ?? []
  const contextMedian = marketPrices.length > 0
    ? median(marketPrices.map((p) => p.unit_price))
    : 0

  const isPriceAnomaly = anomaly.anomaly_type === "PRICE_ANOMALY"
  const isFragmentation = anomaly.anomaly_type === "FRAGMENTATION"
  const isCollusion = anomaly.anomaly_type === "COLLUSION"

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex justify-end transition-opacity"
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        className={`w-full sm:w-[540px] lg:w-[620px] h-screen bg-surface shadow-2xl flex flex-col border-l border-outline-variant/30 ${className}`}
      >
      <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest">
            {t("drawer.detail_title")}
          </p>
          <h2 className="font-display font-bold text-primary text-lg">
            {t("drawer.case_label")} {ctx?.process_code || anomaly.contract_id?.toString().slice(0, 12).toUpperCase() || anomaly.id.slice(0, 12).toUpperCase()}
          </h2>
          <div className="flex items-center gap-3 mt-1">
            {ctx?.supplier_name && (
              <span className="text-xs font-semibold text-on-surface">{ctx.supplier_name}</span>
            )}
            {ctx?.institution_name && (
              <span className="text-xs text-outline">· {ctx.institution_name}</span>
            )}
            {ctx?.amount != null && (
              <span className="text-xs text-outline">· RD$ {ctx.amount.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</span>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" isIconOnly onClick={onClose} className="!p-2">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-outline uppercase tracking-wide">
            {t("drawer.severity_index")}
          </h4>
          <SeverityGauge value={anomaly.severity * 100} confidence={ctx?.confidence} signalsCount={ctx?.signals_count} />
        </div>

        {anomaly.description && (
          <div className="bg-background rounded-xl p-4 border border-outline-variant/20">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1.5">
              {t("drawer.alert_detail")}
            </p>
            <p className="text-sm text-on-surface leading-relaxed">
              {anomaly.description}
            </p>
            {isCollusion && anomaly.detection_metadata && Object.keys(anomaly.detection_metadata).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-outline-variant/20">
                {Object.entries(anomaly.detection_metadata).map(([key, value]) => {
                  const cfg = SIGNAL_CONFIG[key]
                  if (!cfg) return null
                  const display = Array.isArray(value) ? value.join(" / ") : String(value)
                  return (
                    <span key={key} className="inline-flex items-center gap-1 text-[10px] bg-background/80 px-2 py-0.5 rounded-full border border-outline-variant/20 font-medium text-outline">
                      <span>{cfg.icon}</span>
                      <span>{cfg.label}: <span className="font-mono text-on-surface">{display}</span></span>
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Marco Normativo Aplicable (Ley 340-06 y Reglamento 416-23) */}
        <div className="bg-surface-container-low/70 rounded-xl p-4 border border-outline-variant/30 space-y-2.5">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary shrink-0" />
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
              Marco Normativo Aplicable · Ley 340-06 y Reg. 416-23
            </p>
          </div>
          {isPriceAnomaly && (
            <div className="space-y-2 text-xs text-on-surface-variant leading-relaxed">
              <p>
                <strong className="text-on-surface">Sobreprecio / Razonabilidad:</strong> Posible vulneración del{" "}
                <span className="font-semibold text-on-surface">Art. 3 (Principio de Eficiencia y Economía — Ley 340-06)</span> y{" "}
                <span className="font-semibold text-on-surface">Arts. 96–97 del Reglamento 416-23</span> sobre estimación previa y estudio de precios de mercado en el SECP.
              </p>
              {marketPrices.filter((mp) => mp.contract_id === anomaly.contract_id).length > 1 && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Indicio de Agrupamiento Indebido CBS/UNSPSC:</strong> Este mismo contrato registra múltiples renglones bajo el mismo código UNSPSC con dispersión interna de precios. Si los bienes físicos son distintos, constituye una{" "}
                    <span className="font-semibold">falta administrativa de catalogación (Art. 3 num. 3 Transparencia y Normativa CBS-DGCP)</span>; seleccione el motivo de descarte por catalogación para dejar constancia en el acta.
                  </div>
                </div>
              )}
            </div>
          )}
          {isFragmentation && (
            <div className="space-y-2 text-xs text-on-surface-variant leading-relaxed">
              <p>
                <strong className="text-on-surface">Prohibición de Fraccionamiento:</strong> Tipificado en los{" "}
                <span className="font-semibold text-on-surface">Arts. 16 y 17 Párrafo I de la Ley 340-06</span> y{" "}
                <span className="font-semibold text-on-surface">Art. 62 del Reglamento 416-23</span> (presunción de subdivisión de compras de la misma familia UNSPSC para eludir umbrales del PACC), sujeto al régimen sancionador de los{" "}
                <span className="font-semibold text-on-surface">Arts. 65 y 66</span>.
              </p>
              {((ctx?.process_code && (ctx.process_code.includes("-PEEN-") || ctx.process_code.includes("-PEEX-") || ctx.process_code.includes("-PEUR-"))) ||
                (ctx?.recent_contracts && ctx.recent_contracts.filter((c) => c.is_alert).length >= 2)) && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    {ctx?.process_code && (ctx.process_code.includes("-PEEN-") || ctx.process_code.includes("-PEEX-") || ctx.process_code.includes("-PEUR-")) ? (
                      <>
                        <strong className="font-bold">Verificación de Procedimiento de Excepción (`PEEN` / `PEEX` / `PEUR`):</strong> El código del expediente indica una modalidad de excepción (<strong>Art. 6 Párrafo Único Ley 340-06</strong> y <strong>Arts. 38–45 Reg. 416-23</strong>). Si las órdenes responden a entregas parciales bajo una misma resolución motivada o urgencia certificada, descarte como falso positivo; si carece de acto administrativo motivado, confirme por fraccionamiento.
                      </>
                    ) : (
                      <>
                        <strong className="font-bold">Verificación de Planificación Anual PACC (Art. 62 Reg. 416-23):</strong> Se detectaron múltiples contratos adjudicados en el mismo período institucional. Verifique si responden a entregas programadas en el PACC o a una subdivisión para evitar licitación pública.
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {isCollusion && (
            <div className="space-y-2 text-xs text-on-surface-variant leading-relaxed">
              <p>
                <strong className="text-on-surface">Colusión y Libre Competencia:</strong> Tipificado en el{" "}
                <span className="font-semibold text-on-surface">Art. 3 nums. 2 y 6</span>,{" "}
                <span className="font-semibold text-on-surface">Arts. 11 y 14 (Prohibiciones por Vinculación / Beneficiario Final)</span> y{" "}
                <span className="font-semibold text-on-surface">Art. 66 Párrafo II de la Ley 340-06</span> (inhabilitación del RPE de 1 a 5 años), en concordancia con el{" "}
                <span className="font-semibold text-on-surface">Art. 5 de la Ley 42-08 (Defensa de la Competencia)</span>.
              </p>
              {anomaly.detection_metadata && Object.keys(anomaly.detection_metadata).length > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    {(anomaly.detection_metadata.shared_phone || anomaly.detection_metadata.shared_address || anomaly.detection_metadata.shared_domain) ? (
                      <>
                        <strong className="font-bold">Indicio Directo de Vinculación Societaria (Ley 155-17 / RPE):</strong> Se detectó coincidencia de datos de contacto físico o corporativo entre oferentes. Solicite la <strong>Declaración Jurada de Beneficiario Final</strong> ante la DGCP para verificar control común (<strong>Art. 14 Ley 340-06</strong>).
                      </>
                    ) : (
                      <>
                        <strong className="font-bold">Coincidencia Nominal o de Secuencia RNC (Señal débil):</strong> El vínculo se basa únicamente en similitud de razón social o prefijo RNC sin compartir teléfono ni domicilio. Verifique en el RPE si se trata de empresas independientes antes de confirmar colusión.
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {ctxLoading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-3 w-24 bg-outline-variant/30 rounded" />
            <div className="h-[200px] bg-outline-variant/20 rounded-2xl" />
            <div className="h-3 w-48 bg-outline-variant/30 rounded" />
            <div className="h-[200px] bg-outline-variant/20 rounded-2xl" />
          </div>
        )}

        {!ctxLoading && isPriceAnomaly && (
          <SectionErrorBoundary title="price analysis">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <h4 className="text-xs font-bold text-outline uppercase tracking-wide">
                  {t("drawer.price_analysis")}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="font-data text-[10px] text-outline">{t("drawer.market_region")}</span>
                  <button onClick={() => setFullscreenChart("price")} className="text-outline hover:text-on-surface transition-colors">
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {marketPrices.length > 0 ? (
                <PriceScatter data={marketPrices} median={contextMedian} />
              ) : (
                <p className="text-sm text-outline text-center py-8">No hay datos de mercado disponibles</p>
              )}
              {ctx?.supplier_name && (
                <p className="text-[11px] text-outline">
                  Proveedor: <span className="font-semibold text-on-surface">{ctx.supplier_name}</span>
                </p>
              )}
            </div>
          </SectionErrorBoundary>
        )}

        {!ctxLoading && isFragmentation && (
          <SectionErrorBoundary title="fragmentation">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="text-xs font-bold text-outline uppercase tracking-wide">
                    Contratos recientes y umbral de fraccionamiento
                  </h4>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Las barras rojas representan contratos individuales que <strong>sumados entre sí</strong> superan el umbral legal.
                  </p>
                </div>
                <button onClick={() => setFullscreenChart("fragmentation")} className="text-outline hover:text-on-surface transition-colors">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
              {ctx?.recent_contracts && ctx.recent_contracts.length > 0 ? (
                <>
                  {(() => {
                    const effectiveThreshold = ctx.fragmentation_threshold ?? 8_000_000
                    const alertContracts = ctx.recent_contracts.filter((c) => c.is_alert)
                    const combinedSum =
                      ctx.fragmentation_combined_amount && ctx.fragmentation_combined_amount > 0
                        ? ctx.fragmentation_combined_amount
                        : alertContracts.reduce((acc, c) => acc + c.amount, 0)
                    const excessPct = effectiveThreshold > 0 ? ((combinedSum / effectiveThreshold - 1) * 100) : 0
                    return (
                      <>
                        {combinedSum > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-outline block">
                                Suma Acumulada ({alertContracts.length || 2} contratos alertados)
                              </span>
                              <span className="font-mono font-bold text-sm text-error">
                                RD$ {combinedSum.toLocaleString("es-DO", { maximumFractionDigits: 0 })}
                              </span>
                              {excessPct > 0 && (
                                <span className="ml-1.5 text-[10px] font-mono font-semibold text-error">
                                  (+{excessPct.toFixed(0)}% sobre umbral)
                                </span>
                              )}
                            </div>
                            <div className="sm:text-right">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-outline block">
                                Umbral de Licitación Evaluado (DGCP)
                              </span>
                              <span className="font-mono font-bold text-sm text-on-surface">
                                RD$ {effectiveThreshold.toLocaleString("es-DO", { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                          </div>
                        )}
                        <FragmentationBarChart
                          entries={ctx.recent_contracts}
                          threshold={effectiveThreshold}
                        />
                        <InstitutionTimeline entries={ctx.recent_contracts} />
                      </>
                    )
                  })()}
                </>
              ) : (
                <p className="text-sm text-outline text-center py-8">No hay contratos recientes para esta institución</p>
              )}
            </div>
          </SectionErrorBoundary>
        )}

        {!ctxLoading && isCollusion && (
          <SectionErrorBoundary title="collusion network">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <h4 className="text-xs font-bold text-outline uppercase tracking-wide">
                  Red de proveedores
                </h4>
                <button onClick={() => setFullscreenChart("collusion")} className="text-outline hover:text-on-surface transition-colors">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
              {ctx?.collusion_links && ctx.collusion_links.length > 0 ? (
                <>
                  <CollusionNetwork links={ctx.collusion_links} />
                  <div className="space-y-2">
                    {ctx.collusion_links.map((link, i) => {
                      const details = link.signal_details as Record<string, unknown> | undefined
                      const detailEntries = details ? Object.entries(details) : []
                      return (
                        <div key={i} className="text-[11px] bg-background rounded-xl p-3 border border-outline-variant/20">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-on-surface">{link.source}</span>
                            <span className="text-outline mx-2">⟷</span>
                            <span className="font-semibold text-on-surface">{link.target}</span>
                            <span className="text-outline ml-auto text-[10px]">{link.reason.replace(/_/g, " ")}</span>
                          </div>
                          {detailEntries.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-outline-variant/20">
                              {detailEntries.map(([key, value]) => {
                                const cfg = SIGNAL_CONFIG[key]
                                if (!cfg) return null
                                const display = Array.isArray(value) ? value.join(" / ") : String(value)
                                return (
                                  <span key={key} className="inline-flex items-center gap-1 text-[10px] bg-surface/80 px-2 py-0.5 rounded-full border border-outline-variant/20 font-medium text-outline">
                                    <span>{cfg.icon}</span>
                                    <span>{cfg.label}: <span className="font-mono text-on-surface">{display}</span></span>
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-outline text-center py-8">No se detectaron vínculos de colusión</p>
              )}
            </div>
          </SectionErrorBoundary>
        )}
      </div>

      <div className="p-6 bg-surface border-t border-outline-variant/20 space-y-4">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full h-24 p-3 text-sm bg-background rounded-xl border border-outline-variant/20 outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none"
          placeholder={t("drawer.notes_placeholder")}
        />
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-outline uppercase tracking-widest">
            {t("drawer.dismiss_reason_label")}
          </label>
          <select
            value={dismissalReason}
            onChange={(e) => setDismissalReason(e.target.value as DismissalReason | "")}
            className="w-full p-2.5 text-sm bg-background rounded-xl border border-outline-variant/20 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
          >
            <option value="">{t("drawer.dismiss_reason_placeholder")}</option>
            {DISMISSAL_REASONS.map((r) => (
              <option key={r.value} value={r.value}>{t(r.labelKey)}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => handleReview("DISMISSED")}
            isDisabled={reviewMutation.isPending}
          >
            {t("drawer.dismiss")}
          </Button>
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => handleReview("CONFIRMED")}
            isDisabled={reviewMutation.isPending}
            className="bg-error text-white shadow-lg shadow-error/10"
          >
            {reviewMutation.isPending ? "..." : t("drawer.confirm")}
          </Button>
        </div>
      </div>
      <FullscreenOverlay
        isOpen={fullscreenChart !== null}
        onClose={() => setFullscreenChart(null)}
      >
        {fullscreenChart === "price" && marketPrices.length > 0 && (
          <PriceScatter data={marketPrices} median={contextMedian} fullscreen />
        )}
        {fullscreenChart === "fragmentation" && ctx?.recent_contracts && ctx.recent_contracts.length > 0 && (
          <FragmentationBarChart entries={ctx.recent_contracts} threshold={ctx.fragmentation_threshold ?? 8_000_000} fullscreen />
        )}
        {fullscreenChart === "collusion" && ctx?.collusion_links && ctx.collusion_links.length > 0 && (
          <CollusionNetwork links={ctx.collusion_links} fullscreen />
        )}
      </FullscreenOverlay>
      </aside>
    </div>
  )
}
