import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Maximize2, X } from "lucide-react"
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

const FRAGMENTATION_THRESHOLD = 8_000_000

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
                <h4 className="text-xs font-bold text-outline uppercase tracking-wide">
                  Contratos recientes
                </h4>
                <button onClick={() => setFullscreenChart("fragmentation")} className="text-outline hover:text-on-surface transition-colors">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
              {ctx?.recent_contracts && ctx.recent_contracts.length > 0 ? (
                <>
                  <FragmentationBarChart
                    entries={ctx.recent_contracts}
                    threshold={FRAGMENTATION_THRESHOLD}
                  />
                  <InstitutionTimeline entries={ctx.recent_contracts} />
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
          <FragmentationBarChart entries={ctx.recent_contracts} threshold={FRAGMENTATION_THRESHOLD} fullscreen />
        )}
        {fullscreenChart === "collusion" && ctx?.collusion_links && ctx.collusion_links.length > 0 && (
          <CollusionNetwork links={ctx.collusion_links} fullscreen />
        )}
      </FullscreenOverlay>
      </aside>
    </div>
  )
}
