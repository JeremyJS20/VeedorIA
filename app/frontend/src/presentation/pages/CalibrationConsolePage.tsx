import { useMemo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Loader2,
  Play,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react"
import {
  useApplyCalibration,
  useCalibrationAnalysis,
  useDetectionConfig,
  useResetDetectionConfig,
  useRunDetection,
  useUpdateDetectionConfig,
} from "../hooks/useAdminOps"
import type { CalibrationTypeAnalysis, DetectionParameter } from "../hooks/useAdminOps"
import Modal from "../components/ui/Modal"

const CATEGORY_LABELS: Record<string, string> = {
  PESOS: "Pesos de scoring",
  UMBRALES: "Umbrales estadísticos",
  UMBRALES_DGCP: "Topes por modalidad DGCP",
}

const ANOMALY_LABELS: Record<string, string> = {
  PRICE_ANOMALY: "Anomalía de precios",
  FRAGMENTATION: "Fraccionamiento de contratos",
  COLLUSION: "Patrón de colusión",
}

const CALIBRATION_KEY_BY_TYPE: Record<string, string> = {
  PRICE_ANOMALY: "price_zscore_threshold",
  FRAGMENTATION: "fragmentation_threshold_dop",
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return "—"
  return new Intl.NumberFormat("es-DO", { maximumFractionDigits: 2 }).format(value)
}

function formatDateTime(value: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function CalibrationConsolePage() {
  const config = useDetectionConfig()
  const updateConfig = useUpdateDetectionConfig()
  const resetConfig = useResetDetectionConfig()
  const analysis = useCalibrationAnalysis()
  const applyCalibration = useApplyCalibration()
  const runDetection = useRunDetection()

  const [edits, setEdits] = useState<Record<string, number>>({})
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmApply, setConfirmApply] = useState<CalibrationTypeAnalysis | null>(null)

  const parameters = useMemo(() => config.data?.parameters ?? [], [config.data])

  const valueOf = (parameter: DetectionParameter): number => edits[parameter.key] ?? parameter.value

  const grouped = useMemo(() => {
    const groups: Record<string, DetectionParameter[]> = {}
    parameters.forEach((parameter) => {
      groups[parameter.category] = groups[parameter.category] ?? []
      groups[parameter.category].push(parameter)
    })
    return groups
  }, [parameters])

  const dirtyKeys = useMemo(
    () =>
      parameters
        .filter((parameter) => parameter.key in edits && edits[parameter.key] !== parameter.value)
        .map((parameter) => parameter.key),
    [parameters, edits]
  )

  const runSave = async () => {
    setFeedback(null)
    try {
      const changes: Record<string, number> = {}
      dirtyKeys.forEach((key) => {
        changes[key] = edits[key]
      })
      const result = await updateConfig.mutateAsync(changes)
      const adjusted = result.adjusted ?? {}
      const adjustedCount = Object.keys(adjusted).length
      setEdits({})
      setFeedback({
        type: "success",
        text:
          adjustedCount > 0
            ? `Parámetros guardados. ${adjustedCount} valor(es) fueron ajustados al rango permitido.`
            : "Parámetros guardados y auditados correctamente.",
      })
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "No fue posible guardar los parámetros.",
      })
    }
  }

  const runReset = async () => {
    setConfirmReset(false)
    setFeedback(null)
    try {
      await resetConfig.mutateAsync(undefined)
      setEdits({})
      setFeedback({ type: "success", text: "Valores por defecto restaurados en todos los parámetros." })
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "No fue posible restaurar los valores por defecto.",
      })
    }
  }

  const runApply = async () => {
    if (!confirmApply) return
    const target = confirmApply
    setConfirmApply(null)
    const key = CALIBRATION_KEY_BY_TYPE[target.anomaly_type]
    if (!key || target.recommended_threshold === null) return
    setFeedback(null)
    try {
      await applyCalibration.mutateAsync({ [key]: target.recommended_threshold })
      setFeedback({
        type: "success",
        text: `Umbral recomendado aplicado a ${ANOMALY_LABELS[target.anomaly_type] ?? target.anomaly_type}: ${formatNumber(
          target.recommended_threshold
        )}.`,
      })
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "No fue posible aplicar el umbral recomendado.",
      })
    }
  }

  const triggerDetection = async () => {
    setFeedback(null)
    try {
      const result = await runDetection.mutateAsync()
      setFeedback({ type: "success", text: `Detección encolada. Job: ${result.task}` })
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "No fue posible ejecutar la detección.",
      })
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-[85rem] mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">
            Calibración Global del Motor Estadístico
          </h1>
          <p className="text-xs text-on-surface-variant mt-1 max-w-3xl">
            Ajuste de los 13 parámetros del motor, análisis de calidad sobre dictámenes humanos y re-ejecución
            controlada del pipeline de detección.
          </p>
        </div>
        <button
          type="button"
          onClick={triggerDetection}
          disabled={runDetection.isPending}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-on-primary text-xs font-bold disabled:opacity-50"
        >
          {runDetection.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Re-ejecutar detección
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-2 text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-500/10 border-rose-500/25 text-rose-800 dark:text-rose-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {config.error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-xs text-rose-800 dark:text-rose-300 font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            {config.error instanceof Error
              ? config.error.message
              : "No fue posible cargar los parámetros del motor."}
          </span>
        </div>
      )}

      {/* Parámetros */}
      <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-on-surface">Parámetros del motor</h2>
            <span className="text-[11px] font-mono text-on-surface-variant">
              {parameters.length} claves
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              disabled={resetConfig.isPending}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-xl border border-outline-variant/35 text-[11px] font-semibold text-on-surface-variant hover:text-primary disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar por defecto
            </button>
            <button
              type="button"
              onClick={runSave}
              disabled={dirtyKeys.length === 0 || updateConfig.isPending}
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl bg-primary text-on-primary text-[11px] font-bold disabled:opacity-40"
            >
              {updateConfig.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Guardar cambios{dirtyKeys.length > 0 ? ` (${dirtyKeys.length})` : ""}
            </button>
          </div>
        </div>

        {config.isLoading ? (
          <div className="p-5 space-y-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-12 rounded-xl bg-surface-container-high animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/15">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="p-5 space-y-3">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-outline">
                  {CATEGORY_LABELS[category] ?? category}
                </h3>
                <div className="space-y-3">
                  {items.map((parameter) => {
                    const value = valueOf(parameter)
                    const dirty = dirtyKeys.includes(parameter.key)
                    return (
                      <div
                        key={parameter.key}
                        className={`rounded-xl border p-3.5 space-y-2 ${
                          dirty
                            ? "border-primary/45 bg-primary/5"
                            : "border-outline-variant/25 bg-surface-container-lowest dark:bg-surface-container-high/40"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-on-surface">{parameter.label}</span>
                            <span className="ml-2 font-mono text-[10px] text-outline">{parameter.key}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={Number.isFinite(value) ? value : 0}
                              min={parameter.min}
                              max={parameter.max}
                              step={parameter.step}
                              onChange={(event) =>
                                setEdits({ ...edits, [parameter.key]: Number(event.target.value) })
                              }
                              className="w-28 h-8 px-2 rounded-lg border border-outline-variant/35 bg-surface-container-lowest dark:bg-surface-container font-mono text-xs text-right text-on-surface"
                            />
                            <span className="text-[10px] font-mono text-on-surface-variant">
                              [{formatNumber(parameter.min)} – {formatNumber(parameter.max)}]
                            </span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={parameter.min}
                          max={parameter.max}
                          step={parameter.step}
                          value={Number.isFinite(value) ? value : parameter.min}
                          onChange={(event) =>
                            setEdits({ ...edits, [parameter.key]: Number(event.target.value) })
                          }
                          className="w-full accent-primary"
                        />
                        <p className="text-[11px] text-on-surface-variant">{parameter.description}</p>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-on-surface-variant">
                          <span>Default: {formatNumber(parameter.default_value)}</span>
                          <span>·</span>
                          <span>Actualizado: {formatDateTime(parameter.updated_at)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Análisis de calibración */}
      <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-on-surface">Calidad del motor sobre dictámenes humanos</h2>
          </div>
          <button
            type="button"
            onClick={() => analysis.refetch()}
            disabled={analysis.isFetching}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-xl border border-outline-variant/35 text-[11px] font-semibold text-on-surface-variant hover:text-primary disabled:opacity-40"
          >
            <Sparkles className={`w-3.5 h-3.5 ${analysis.isFetching ? "animate-pulse" : ""}`} />
            Recalcular
          </button>
        </div>

        <div className="p-5 space-y-4">
          {analysis.isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-40 rounded-xl bg-surface-container-high animate-pulse" />
              ))}
            </div>
          ) : analysis.error ? (
            <p className="text-xs text-rose-600 dark:text-rose-400">
              {analysis.error instanceof Error
                ? analysis.error.message
                : "No fue posible calcular el análisis de calibración."}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {(analysis.data?.types ?? []).map((type) => {
                  const insufficient = analysis.data?.insufficient_data?.includes(type.anomaly_type)
                  return (
                    <div
                      key={type.anomaly_type}
                      className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-high/40 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-on-surface">
                          {ANOMALY_LABELS[type.anomaly_type] ?? type.anomaly_type}
                        </span>
                        <span className="text-[10px] font-mono text-on-surface-variant">
                          {type.reviews} dictámenes
                        </span>
                      </div>

                      {insufficient && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-300">
                          Sin dictámenes suficientes para calibrar este tipo.
                        </p>
                      )}

                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          { label: "TP", value: type.tp },
                          { label: "FP", value: type.fp },
                          { label: "FN", value: type.fn },
                        ].map((metric) => (
                          <div key={metric.label} className="rounded-lg bg-surface-container-high/70 py-2">
                            <span className="block text-[10px] font-bold text-on-surface-variant">
                              {metric.label}
                            </span>
                            <span className="font-mono text-sm font-bold text-on-surface">{metric.value}</span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1 text-[11px] font-mono text-on-surface-variant">
                        <div className="flex justify-between">
                          <span>Precision</span>
                          <span className="text-on-surface">{formatPercent(type.precision)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Recall</span>
                          <span className="text-on-surface">{formatPercent(type.recall)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>F1</span>
                          <span className="text-primary font-bold">{formatPercent(type.f1)}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-outline-variant/20 space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-on-surface-variant">Umbral actual</span>
                          <span className="font-mono text-on-surface">{formatNumber(type.current_threshold)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-on-surface-variant">Recomendado</span>
                          <span className="font-mono text-primary font-bold">
                            {formatNumber(type.recommended_threshold)}
                          </span>
                        </div>
                      </div>

                      {type.recommended_threshold !== null && CALIBRATION_KEY_BY_TYPE[type.anomaly_type] && (
                        <button
                          type="button"
                          onClick={() => setConfirmApply(type)}
                          disabled={applyCalibration.isPending}
                          className="w-full h-9 rounded-xl bg-primary/10 text-primary text-[11px] font-bold hover:bg-primary/15 disabled:opacity-40"
                        >
                          Aplicar umbral recomendado
                        </button>
                      )}

                      {type.anomaly_type === "COLLUSION" &&
                        type.confirmation_rate_by_level &&
                        Object.keys(type.confirmation_rate_by_level).length > 0 && (
                          <div className="space-y-1 text-[10px] font-mono text-on-surface-variant">
                            <span className="font-bold">Tasa de confirmación por nivel</span>
                            {Object.entries(type.confirmation_rate_by_level).map(([level, rate]) => (
                              <div key={level} className="flex justify-between">
                                <span>{level}</span>
                                <span className="text-on-surface">{formatPercent(rate)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                      {type.grid.length > 0 && (
                        <details className="text-[11px]">
                          <summary className="cursor-pointer text-on-surface-variant hover:text-primary">
                            Ver rejilla evaluada ({type.grid.length})
                          </summary>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {type.grid.map((threshold) => (
                              <span
                                key={threshold}
                                className={`px-2 py-1 rounded-md font-mono text-[10px] border ${
                                  threshold === type.recommended_threshold
                                    ? "border-primary/50 bg-primary/10 text-primary font-bold"
                                    : "border-outline-variant/25 text-on-surface-variant"
                                }`}
                              >
                                {formatNumber(threshold)}
                              </span>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  )
                })}
              </div>

              <p className="text-[11px] text-on-surface-variant">
                Generado: {formatDateTime(analysis.data?.generated_at ?? null)} · El análisis se calcula sobre
                anomalías con dictamen CONFIRMED/DISMISSED.
              </p>
            </>
          )}
        </div>
      </section>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Restaurar valores por defecto"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="h-9 px-3 rounded-xl border border-outline-variant/35 text-[11px] font-semibold text-on-surface-variant"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={runReset}
              className="h-9 px-3 rounded-xl bg-primary text-on-primary text-[11px] font-bold"
            >
              Restaurar
            </button>
          </>
        }
      >
        <p className="text-xs text-on-surface-variant">
          Se restaurarán los 13 parámetros del motor a su valor por defecto y la acción quedará registrada en la
          bitácora. ¿Deseas continuar?
        </p>
      </Modal>

      <Modal
        open={confirmApply !== null}
        onClose={() => setConfirmApply(null)}
        title="Aplicar umbral recomendado"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmApply(null)}
              className="h-9 px-3 rounded-xl border border-outline-variant/35 text-[11px] font-semibold text-on-surface-variant"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={runApply}
              className="h-9 px-3 rounded-xl bg-primary text-on-primary text-[11px] font-bold"
            >
              Aplicar
            </button>
          </>
        }
      >
        {confirmApply && (
          <div className="text-xs text-on-surface-variant space-y-2">
            <p>
              {ANOMALY_LABELS[confirmApply.anomaly_type] ?? confirmApply.anomaly_type}: se cambiará{" "}
              <span className="font-mono text-on-surface">
                {CALIBRATION_KEY_BY_TYPE[confirmApply.anomaly_type]}
              </span>{" "}
              de <span className="font-mono text-on-surface">{formatNumber(confirmApply.current_threshold)}</span> a{" "}
              <span className="font-mono text-primary font-bold">
                {formatNumber(confirmApply.recommended_threshold)}
              </span>
              .
            </p>
            <p>El cambio se persiste en detection_config y queda auditado con el diff.</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
