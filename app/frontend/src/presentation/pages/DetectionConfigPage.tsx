import { useState, useMemo } from "react"
import {
  Save,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react"
import { toast } from "@heroui/react"
import { useDetectionConfig, useUpdateDetectionConfig } from "../hooks/useAuditorB2G"
import { useAuth } from "../context/AuthContext"

const MODALITY_SIGLA_MAP: Record<string, { code: string; lawRef: string }> = {
  THRESHOLD_CD_DOP: { code: "-CD-", lawRef: "Art. 16 Num. 7 · Compra Debajo del Umbral" },
  THRESHOLD_CM_DOP: { code: "-CM-", lawRef: "Art. 16 Num. 6 · Compra Menor" },
  THRESHOLD_CP_DOP: { code: "-CP-", lawRef: "Art. 16 Num. 4 · Comparación de Precios" },
  THRESHOLD_PEIN_DOP: { code: "-PEIN- / -PEPU-", lawRef: "Arts. 38–45 Reg. 416-23 · Excepción Ordinaria" },
  THRESHOLD_LPN_DOP: { code: "-LPN- / -LPI-", lawRef: "Art. 16 Num. 1 · Licitación Pública" },
  THRESHOLD_PEEN_DOP: { code: "-PEEN- / -PEUR-", lawRef: "Art. 6 Párrafo Único · Emergencia / Urgencia" },
  FRAGMENTATION_THRESHOLD_DOP: { code: "GENERAL", lawRef: "Art. 62 Reg. 416-23 · Sin Sigla Específica" },
}

function formatParameterValue(key: string, category: string, val: number): string {
  if (category === "PESOS") return `${val.toFixed(2)}x`
  if (key.endsWith("_DOP") || category === "UMBRALES_DGCP") {
    return `RD$ ${val.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`
  }
  if (key.includes("PCT")) return `${val.toFixed(0)}%`
  if (key.includes("DAYS")) return `${val.toFixed(0)} días`
  if (key === "MIN_CRITICAL_SEVERITY") return `${(val * 100).toFixed(0)} pts`
  return val.toFixed(2)
}

export default function DetectionConfigPage() {
  const { data, isLoading } = useDetectionConfig()
  const updateMutation = useUpdateDetectionConfig()
  const { user } = useAuth()

  const [draftValues, setDraftValues] = useState<Record<string, number>>({})
  const [savedNotice, setSavedNotice] = useState(false)
  const [activeTab, setActiveTab] = useState<"MOTOR" | "MODALIDADES">("MOTOR")

  // El backend solo habilita la edición a PLATFORM_ADMIN. Se combina con el rol
  // efectivo de la UI para que la vista previa de roles también sea de solo lectura.
  const canEdit = Boolean(data?.can_edit) && user?.rol?.codigo === "PLATFORM_ADMIN"
  const parameters = useMemo(() => data?.parameters ?? [], [data?.parameters])

  const weightsList = useMemo(() => parameters.filter((p) => p.category === "PESOS"), [parameters])
  const coreThresholdsList = useMemo(() => parameters.filter((p) => p.category === "UMBRALES"), [parameters])
  const dgcpModalityList = useMemo(() => parameters.filter((p) => p.category === "UMBRALES_DGCP"), [parameters])

  const handleValueChange = (key: string, val: number) => {
    if (Number.isNaN(val)) return
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
    toast.success("Valores base restablecidos")
  }

  const handleSave = async () => {
    if (!canEdit) return
    const payload: Record<string, number> = {}
    for (const p of parameters) {
      payload[p.key] = draftValues[p.key] ?? p.value
    }
    await updateMutation.mutateAsync(payload)
    setSavedNotice(true)
    toast.success("Calibración guardada exitosamente")
  }

  const modifiedCount = parameters.filter(
    (p) => Math.abs((draftValues[p.key] ?? p.value) - p.default_value) > 0.001
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
            Configuración de ponderaciones del motor analítico y tabla de umbrales por modalidad DGCP en base de datos.
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

      {/* 3 Clean Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-primary rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Parámetros en Base de Datos
          </p>
          <p className="font-mono text-2xl font-bold text-on-surface mt-2">
            {parameters.length} Reglas Activas
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            {weightsList.length + coreThresholdsList.length} reglas del motor y {dgcpModalityList.length} topes DGCP
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

      {/* Clean Segmented Switch: Motor vs. Tabla de Umbrales DGCP */}
      <div className="flex items-center justify-between border-b border-outline-variant/25 pb-3">
        <div className="inline-flex p-1 rounded-xl bg-surface-container-low border border-outline-variant/30">
          <button
            type="button"
            onClick={() => setActiveTab("MOTOR")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "MOTOR"
                ? "bg-surface-container-lowest dark:bg-surface-container text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            1. Pesos y Sensibilidad del Motor ({weightsList.length + coreThresholdsList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("MODALIDADES")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "MODALIDADES"
                ? "bg-surface-container-lowest dark:bg-surface-container text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            2. Tabla de Umbrales por Modalidad DGCP ({dgcpModalityList.length})
          </button>
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
              Calibración actualizada en base de datos y registrada en la bitácora de auditoría institucional.
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
      ) : activeTab === "MOTOR" ? (
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
                        {formatParameterValue(param.key, param.category, currentVal)}
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
                        Base: {formatParameterValue(param.key, param.category, param.default_value)}
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
              {coreThresholdsList.map((param) => {
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
                        {formatParameterValue(param.key, param.category, currentVal)}
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
                        Base: {formatParameterValue(param.key, param.category, param.default_value)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Clean Institutional Table for DGCP Modality Thresholds */
        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/25 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold text-on-surface">
                Topes por Modalidad de Contratación Pública (Ley 340-06 · Reg. 416-23)
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Montos almacenados en base de datos utilizados para evaluar el fraccionamiento según la sigla del proceso
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-surface-container-high text-xs font-mono font-semibold text-on-surface shrink-0">
              {dgcpModalityList.length} modalidades
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/25 bg-surface-container-low/60 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  <th className="py-3 px-5">Sigla en Proceso</th>
                  <th className="py-3 px-5">Modalidad y Referencia Normativa</th>
                  <th className="py-3 px-5 text-right">Valor Base (DOP)</th>
                  <th className="py-3 px-5 text-right">Tope Vigente Configurable (DOP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-xs">
                {dgcpModalityList.map((param) => {
                  const currentVal = draftValues[param.key] ?? param.value
                  const meta = MODALITY_SIGLA_MAP[param.key] || {
                    code: param.key,
                    lawRef: "Ley 340-06",
                  }
                  return (
                    <tr key={param.key} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary font-mono text-xs font-bold">
                          {meta.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="font-bold text-on-surface">{param.label}</p>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          {meta.lawRef} — {param.description}
                        </p>
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono text-on-surface-variant whitespace-nowrap">
                        RD$ {param.default_value.toLocaleString("es-DO")}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <span className="font-mono text-xs font-semibold text-on-surface-variant">RD$</span>
                          <input
                            type="number"
                            disabled={!canEdit}
                            min={param.min}
                            max={param.max}
                            step={param.step}
                            value={currentVal}
                            onChange={(e) => handleValueChange(param.key, parseFloat(e.target.value))}
                            className="w-36 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 font-mono text-xs font-bold text-right text-on-surface focus:outline-none focus:border-primary disabled:opacity-60"
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}