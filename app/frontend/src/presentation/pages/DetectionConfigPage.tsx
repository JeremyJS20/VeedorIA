import { useState } from "react"
import {
  Save,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  SlidersHorizontal,
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

  const modifiedCount = parameters.filter(
    (p) => (draftValues[p.key] ?? p.value) !== p.default_value
  ).length

  return (
    <div className="p-6 sm:p-8 max-w-[80rem] mx-auto space-y-6">
      {/* Header matching OverviewDashboardPage & UsersManagementPage */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">
            Parámetros y Calibración de Detección
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Configuración de ponderaciones y umbrales operativos que rigen la priorización de hallazgos en la bandeja institucional.
          </p>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/40 text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-primary" />
              <span>Valores Base</span>
            </button>
            <button
              type="button"
              disabled={updateMutation.isPending}
              onClick={() => void handleSave()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-95 transition-opacity shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{updateMutation.isPending ? "Guardando..." : "Guardar Calibración"}</span>
            </button>
          </div>
        )}
      </div>

      {/* 3 Summary KPI Cards matching MarketIntelligencePage */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-primary rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Parámetros Activos
          </p>
          <p className="font-mono text-2xl font-bold text-on-surface mt-2">
            {parameters.length} Reglas Operativas
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            {weightsList.length} ponderaciones y {thresholdsList.length} umbrales
          </p>
        </div>

        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-outline-variant rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Ajustes Personalizados
          </p>
          <p className="font-mono text-2xl font-bold text-on-surface mt-2">
            {modifiedCount} {modifiedCount === 1 ? "Parámetro" : "Parámetros"}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Con respecto a la línea base institucional
          </p>
        </div>

        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-primary rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Privilegio de Calibración
          </p>
          <p className="font-mono text-2xl font-bold text-primary mt-2">
            {canEdit ? "Edición Habilitada" : "Modo Consulta"}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Trazabilidad inmutable en bitácora
          </p>
        </div>
      </div>

      {!canEdit && !isLoading && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-on-surface">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>Modo de consulta activa:</strong> Su perfil tiene acceso de lectura a los criterios de evaluación vigentes. La modificación de umbrales y ponderaciones está reservada a perfiles de Contraloría o Administración Institucional.
          </div>
        </div>
      )}

      {savedNotice && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              Calibración actualizada y registrada en la bitácora de auditoría institucional.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSavedNotice(false)}
            className="underline opacity-75 hover:opacity-100 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-72 rounded-2xl bg-surface-container-low animate-pulse border border-outline-variant/25"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Ponderación por Tipología */}
          <div className="lg:col-span-6 bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-6 space-y-5 shadow-xs">
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-outline-variant/25">
              <div>
                <h2 className="font-display text-base font-bold text-on-surface">
                  Ponderación por Tipología de Riesgo
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Peso relativo de cada familia de indicadores en el puntaje de severidad
                </p>
              </div>
              <span className="px-3 py-1 rounded-lg bg-surface-container-high text-xs font-mono font-semibold text-on-surface shrink-0">
                Multiplicador
              </span>
            </div>

            <div className="space-y-4">
              {weightsList.map((param) => {
                const currentVal = draftValues[param.key] ?? param.value
                return (
                  <div
                    key={param.key}
                    className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/30 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-on-surface">{param.label}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                          {param.description}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold shrink-0">
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
                      <span className="text-[11px] font-mono text-on-surface-variant shrink-0">
                        Base: {param.default_value.toFixed(2)}x
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: Umbrales de Activación */}
          <div className="lg:col-span-6 bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-6 space-y-5 shadow-xs">
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-outline-variant/25">
              <div>
                <h2 className="font-display text-base font-bold text-on-surface">
                  Umbrales de Activación y Severidad
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Puntos de corte a partir de los cuales se emiten alertas críticas o preventivas
                </p>
              </div>
              <span className="px-3 py-1 rounded-lg bg-surface-container-high text-xs font-mono font-semibold text-on-surface shrink-0">
                Corte Operativo
              </span>
            </div>

            <div className="space-y-4">
              {thresholdsList.map((param) => {
                const currentVal = draftValues[param.key] ?? param.value
                return (
                  <div
                    key={param.key}
                    className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/30 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-on-surface">{param.label}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                          {param.description}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold shrink-0">
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
                      <span className="text-[11px] font-mono text-on-surface-variant shrink-0">
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
      <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-5 shadow-xs flex items-start gap-3">
        <SlidersHorizontal className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Cualquier modificación aplicada sobre estos parámetros queda asentada de forma inmutable en el registro de auditoría con fecha, usuario responsable y valores previos, garantizando trazabilidad ante revisiones de control interno.
        </p>
      </div>
    </div>
  )
}
