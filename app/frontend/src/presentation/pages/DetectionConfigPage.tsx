import { useState } from "react"
import {
  SlidersHorizontal,
  Save,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  Scale,
  Gauge,
} from "lucide-react"
import { useDetectionConfig, useUpdateDetectionConfig } from "../hooks/useAuditorB2G"

export default function DetectionConfigPage() {
  const { data, isLoading } = useDetectionConfig()
  const updateMutation = useUpdateDetectionConfig()

  const [draftValues, setDraftValues] = useState<Record<string, number>>({})
  const [savedNotice, setSavedNotice] = useState(false)



  const canEdit = Boolean(data?.can_edit)
  const parameters = data?.parameters || []
  const weightsList = parameters.filter((p) => p.category === "PESOS")
  const thresholdsList = parameters.filter((p) => p.category !== "PESOS")

  const handleValueChange = (key: string, val: number) => {
    setSavedNotice(false)
    setDraftValues((prev) => ({ ...prev, [key]: val }))
  }

  const handleResetDefaults = () => {
    if (!canEdit) return
    const defaults: Record<string, number> = {}
    for (const p of parameters) {
      defaults[p.key] = p.default_value
    }
    setDraftValues(defaults)
    setSavedNotice(false)
  }

  const handleSave = async () => {
    if (!canEdit) return
    const payload: Record<string, number> = {}
    for (const p of parameters) {
      payload[p.key] = draftValues[p.key] ?? p.value
    }
    await updateMutation.mutateAsync(payload)
    setSavedNotice(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">
            Parámetros de Detección
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Calibración de ponderaciones y umbrales operativos que rigen la priorización de hallazgos en la bandeja institucional.
          </p>
        </div>

        {canEdit && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="h-10 px-4 rounded-lg border border-outline-variant/40 bg-surface text-xs font-semibold text-on-surface hover:bg-surface-container-high flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Valores por Defecto
            </button>
            <button
              type="button"
              disabled={updateMutation.isPending}
              onClick={() => void handleSave()}
              className="h-10 px-4 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {updateMutation.isPending ? "Guardando..." : "Guardar Calibración"}
            </button>
          </div>
        )}
      </div>

      {!canEdit && !isLoading && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-on-surface leading-relaxed">
            <strong>Modo de consulta activa:</strong> Su perfil tiene acceso de lectura a los criterios de evaluación vigentes. La modificación de umbrales y ponderaciones está reservada a perfiles de Contraloría o Administración Institucional.
          </div>
        </div>
      )}

      {savedNotice && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold text-on-surface">
            Calibración actualizada y registrada en la bitácora de auditoría institucional.
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-12 text-center text-sm text-on-surface-variant">
          Cargando parámetros de detección...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Columna 1: Pesos por Tipología */}
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/20">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-on-surface">
                  Ponderación por Tipología de Riesgo
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Define el peso relativo de cada familia de indicadores en el puntaje compuesto de severidad.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {weightsList.map((param) => {
                const currentVal = draftValues[param.key] ?? param.value
                return (
                  <div
                    key={param.key}
                    className="bg-surface border border-outline-variant/30 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{param.label}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {param.description}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono text-sm font-bold shrink-0">
                        {currentVal.toFixed(2)}x
                      </span>
                    </div>

                    <div className="flex items-center gap-4 pt-1">
                      <input
                        type="range"
                        disabled={!canEdit}
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        value={currentVal}
                        onChange={(e) => handleValueChange(param.key, parseFloat(e.target.value))}
                        aria-label={param.label}
                        className="flex-1 accent-primary cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="text-[11px] font-mono text-on-surface-variant">
                        Base: {param.default_value.toFixed(2)}x
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Columna 2: Umbrales Operativos */}
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/20">
              <div className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-on-surface">
                  Umbrales de Activación y Severidad
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Controla los puntos de corte a partir de los cuales se emiten alertas críticas o preventivas.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {thresholdsList.map((param) => {
                const currentVal = draftValues[param.key] ?? param.value
                return (
                  <div
                    key={param.key}
                    className="bg-surface border border-outline-variant/30 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{param.label}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {param.description}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-secondary/10 text-secondary font-mono text-sm font-bold shrink-0">
                        {currentVal}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 pt-1">
                      <input
                        type="range"
                        disabled={!canEdit}
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        value={currentVal}
                        onChange={(e) => handleValueChange(param.key, parseFloat(e.target.value))}
                        aria-label={param.label}
                        className="flex-1 accent-primary cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="text-[11px] font-mono text-on-surface-variant">
                        Base: {param.default_value} · Act: {param.updated_at}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Nota Metodológica */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5 flex items-start gap-3">
        <SlidersHorizontal className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Cualquier modificación aplicada sobre estos parámetros queda asentada de forma inmutable en el registro de auditoría con fecha, usuario responsable y valores previos, garantizando trazabilidad ante revisiones de control interno.
        </p>
      </div>
    </div>
  )
}
