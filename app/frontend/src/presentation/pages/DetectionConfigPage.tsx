import { useState, useMemo } from "react"
import {
  Save,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  SlidersHorizontal,
  Scale,
  Gauge,
  Sparkles,
  Activity,
  Clock,
  Landmark,
  Flame,
  ShieldCheck,
  TrendingUp,
} from "lucide-react"
import { toast } from "@heroui/react"
import { useDetectionConfig, useUpdateDetectionConfig } from "../hooks/useAuditorB2G"

const MODALITY_SIGLA_BADGES: Record<string, { code: string; lawRef: string }> = {
  THRESHOLD_CD_DOP: { code: "-CD-", lawRef: "Art. 16 Num. 7 · Compra Debajo del Umbral" },
  THRESHOLD_CM_DOP: { code: "-CM-", lawRef: "Art. 16 Num. 6 · Compra Menor" },
  THRESHOLD_CP_DOP: { code: "-CP-", lawRef: "Art. 16 Num. 4 · Comparación de Precios" },
  THRESHOLD_PEIN_DOP: { code: "-PEIN- / -PEPU-", lawRef: "Arts. 38–45 Reg. 416-23 · Excepción Ordinaria" },
  THRESHOLD_LPN_DOP: { code: "-LPN- / -LPI-", lawRef: "Art. 16 Num. 1 · Licitación Pública" },
  THRESHOLD_PEEN_DOP: { code: "-PEEN- / -PEUR-", lawRef: "Art. 6 Párrafo Único · Emergencia Nacional" },
  FRAGMENTATION_THRESHOLD_DOP: { code: "GENERAL", lawRef: "Art. 62 Reg. 416-23 · Tope Base PACC" },
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

  const [draftValues, setDraftValues] = useState<Record<string, number>>({})
  const [savedNotice, setSavedNotice] = useState(false)
  const [activePreset, setActivePreset] = useState<"ESTANDAR" | "ESTRICTO" | "EMERGENCIA" | "CUSTOM">("ESTANDAR")

  const canEdit = Boolean(data?.can_edit)
  const parameters = data?.parameters || []

  const weightsList = useMemo(() => parameters.filter((p) => p.category === "PESOS"), [parameters])
  const coreThresholdsList = useMemo(() => parameters.filter((p) => p.category === "UMBRALES"), [parameters])
  const dgcpModalityList = useMemo(() => parameters.filter((p) => p.category === "UMBRALES_DGCP"), [parameters])

  const getEffectiveValue = (key: string, fallback: number) => {
    const p = parameters.find((item) => item.key === key)
    return draftValues[key] ?? p?.value ?? fallback
  }

  const handleValueChange = (key: string, val: number) => {
    if (Number.isNaN(val)) return
    setSavedNotice(false)
    setActivePreset("CUSTOM")
    setDraftValues((prev) => ({ ...prev, [key]: val }))
  }

  const applyPreset = (preset: "ESTANDAR" | "ESTRICTO" | "EMERGENCIA") => {
    if (!canEdit) return
    setSavedNotice(false)
    setActivePreset(preset)
    const next: Record<string, number> = {}
    for (const p of parameters) {
      next[p.key] = p.default_value
    }
    if (preset === "ESTRICTO") {
      next["PRICE_ANOMALY_WEIGHT"] = 1.4
      next["FRAGMENTATION_WEIGHT"] = 1.5
      next["COLLUSION_WEIGHT"] = 1.5
      next["MIN_CRITICAL_SEVERITY"] = 0.65
      next["PRICE_VARIATION_PCT_THRESHOLD"] = 30.0
      next["FRAGMENTATION_WINDOW_DAYS"] = 45.0
      next["THRESHOLD_CM_DOP"] = 1400000.0
      next["THRESHOLD_CP_DOP"] = 5500000.0
    } else if (preset === "EMERGENCIA") {
      next["PRICE_ANOMALY_WEIGHT"] = 1.3
      next["FRAGMENTATION_WEIGHT"] = 1.6
      next["COLLUSION_WEIGHT"] = 1.4
      next["MIN_CRITICAL_SEVERITY"] = 0.70
      next["PRICE_VARIATION_PCT_THRESHOLD"] = 35.0
      next["FRAGMENTATION_WINDOW_DAYS"] = 60.0
      next["THRESHOLD_PEEN_DOP"] = 18000000.0
    }
    setDraftValues(next)
    toast.success(
      preset === "ESTRICTO"
        ? "Perfil de Contraloría Estricta pre-cargado"
        : preset === "EMERGENCIA"
        ? "Perfil de Fiscalización de Emergencias pre-cargado"
        : "Valores oficiales DGCP restablecidos"
    )
  }

  const handleResetDefaults = () => applyPreset("ESTANDAR")

  const handleSave = async () => {
    if (!canEdit) return
    const payload: Record<string, number> = {}
    for (const p of parameters) {
      payload[p.key] = draftValues[p.key] ?? p.value
    }
    await updateMutation.mutateAsync(payload)
    setSavedNotice(true)
    toast.success("Calibración guardada en PostgreSQL y registrada en Bitácora")
  }

  const modifiedCount = parameters.filter(
    (p) => Math.abs((draftValues[p.key] ?? p.value) - p.default_value) > 0.001
  ).length

  const wPrice = getEffectiveValue("PRICE_ANOMALY_WEIGHT", 1.0)
  const wFrag = getEffectiveValue("FRAGMENTATION_WEIGHT", 1.0)
  const wColl = getEffectiveValue("COLLUSION_WEIGHT", 1.0)
  const totalWeight = Math.max(0.1, wPrice + wFrag + wColl)
  const pctPriceShare = Math.round((wPrice / totalWeight) * 100)
  const pctFragShare = Math.round((wFrag / totalWeight) * 100)
  const pctCollShare = Math.max(0, 100 - pctPriceShare - pctFragShare)

  const minCritSev = getEffectiveValue("MIN_CRITICAL_SEVERITY", 0.75)
  const priceVarPct = getEffectiveValue("PRICE_VARIATION_PCT_THRESHOLD", 50.0)
  const fragWindowDays = getEffectiveValue("FRAGMENTATION_WINDOW_DAYS", 30.0)

  const strictnessScore = Math.min(
    100,
    Math.max(
      15,
      Math.round(
        ((wPrice + wFrag + wColl) / 3.0) * 35 +
          (1 - minCritSev) * 100 * 0.8 +
          (100 - Math.min(priceVarPct, 100)) * 0.25 +
          (fragWindowDays / 90) * 15
      )
    )
  )
  return (
    <div className="p-6 sm:p-8 max-w-[80rem] mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">
            Centro de Calibración Algorítmica y Umbrales DGCP
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Gobernanza en base de datos de los pesos de Machine Learning, sensibilidad estadística y topes normativos por modalidad (Ley 340-06 · Decreto 416-23).
          </p>
        </div>

        {canEdit && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/40 text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-primary" />
              <span>Restaurar Línea Base</span>
            </button>
            <button
              type="button"
              disabled={updateMutation.isPending}
              onClick={() => void handleSave()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-95 transition-opacity shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{updateMutation.isPending ? "Persistiendo en BD..." : "Guardar Calibración en BD"}</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-primary rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Reglas en Base de Datos
            </p>
            <SlidersHorizontal className="w-4 h-4 text-primary" />
          </div>
          <p className="font-mono text-2xl font-bold text-on-surface mt-2">
            {parameters.length} Parámetros
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            {weightsList.length} pesos · {coreThresholdsList.length} cortes · {dgcpModalityList.length} topes DGCP
          </p>
        </div>

        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-emerald-500 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Índice de Rigor Preventivo
            </p>
            <Gauge className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="font-mono text-2xl font-bold text-on-surface mt-2">
            {strictnessScore}/100
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            {strictnessScore >= 75 ? "Sensibilidad Estricto / Contraloría" : strictnessScore >= 50 ? "Equilibrio Estándar SECP" : "Tolerancia Amplia"}
          </p>
        </div>

        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-amber-500 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Desviaciones vs. Base
            </p>
            <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="font-mono text-2xl font-bold text-on-surface mt-2">
            {modifiedCount} {modifiedCount === 1 ? "Ajuste" : "Ajustes"}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            {Object.keys(draftValues).length > 0 ? "Con cambios listos para guardar" : "Sincronizado con PostgreSQL"}
          </p>
        </div>

        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-primary rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Gobernanza y Auditoría
            </p>
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <p className="font-mono text-2xl font-bold text-primary mt-2">
            {canEdit ? "Edición Activa" : "Solo Lectura"}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Cero constantes fijas · 100% persistido
          </p>
        </div>
      </div>

      <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-outline-variant/25">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-on-surface">
                Perfiles Rápidos de Fiscalización y Simulador de Impacto en Tiempo Real
              </h2>
              <p className="text-xs text-on-surface-variant">
                Aplique una plantilla normativa pre-calibrada o ajuste cada parámetro individualmente viendo su efecto inmediato en la ecuación de riesgo.
              </p>
            </div>
          </div>

          {canEdit && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => applyPreset("ESTANDAR")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  activePreset === "ESTANDAR"
                    ? "bg-primary text-on-primary border-primary shadow-xs"
                    : "bg-surface-container-low text-on-surface border-outline-variant/35 hover:border-primary/40"
                }`}
              >
                Estándar DGCP (Oficial)
              </button>
              <button
                type="button"
                onClick={() => applyPreset("ESTRICTO")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  activePreset === "ESTRICTO"
                    ? "bg-primary text-on-primary border-primary shadow-xs"
                    : "bg-surface-container-low text-on-surface border-outline-variant/35 hover:border-primary/40"
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                Contraloría Estricta
              </button>
              <button
                type="button"
                onClick={() => applyPreset("EMERGENCIA")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  activePreset === "EMERGENCIA"
                    ? "bg-primary text-on-primary border-primary shadow-xs"
                    : "bg-surface-container-low text-on-surface border-outline-variant/35 hover:border-primary/40"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Auditoría de Emergencias (PEEN)
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-on-surface">
                Balance de Influencia en el Índice de Severidad AI
              </span>
              <span className="font-mono text-[11px] text-on-surface-variant">
                Sobreprecio {pctPriceShare}% · Fraccionamiento {pctFragShare}% · Colusión {pctCollShare}%
              </span>
            </div>
            <div className="w-full h-3.5 rounded-full bg-surface-container-high overflow-hidden flex p-0.5 gap-0.5">
              <div
                style={{ width: `${pctPriceShare}%` }}
                className="h-full bg-primary rounded-l-full transition-all duration-300"
                title={`Sobreprecio: ${pctPriceShare}%`}
              />
              <div
                style={{ width: `${pctFragShare}%` }}
                className="h-full bg-amber-500 transition-all duration-300"
                title={`Fraccionamiento: ${pctFragShare}%`}
              />
              <div
                style={{ width: `${pctCollShare}%` }}
                className="h-full bg-red-500 rounded-r-full transition-all duration-300"
                title={`Colusión: ${pctCollShare}%`}
              />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-on-surface-variant pt-1">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
                Sobreprecio UNSPSC ({wPrice.toFixed(1)}x)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                Fraccionamiento PACC ({wFrag.toFixed(1)}x)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                Red de Colusión ({wColl.toFixed(1)}x)
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Corte Crítico
              </p>
              <p className="font-mono text-sm font-bold text-red-600 dark:text-red-400 mt-1">
                ≥ {(minCritSev * 100).toFixed(0)} / 100
              </p>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Desvío Mínimo
              </p>
              <p className="font-mono text-sm font-bold text-primary mt-1">
                +{priceVarPct.toFixed(0)}% vs Mediana
              </p>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Ventana PACC
              </p>
              <p className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400 mt-1">
                {fragWindowDays.toFixed(0)} días
              </p>
            </div>
          </div>
        </div>
      </div>
      {!canEdit && !isLoading && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-on-surface">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>Modo de consulta activa:</strong> Su perfil tiene acceso de lectura a los parámetros vigentes en la base de datos. La modificación de umbrales y ponderaciones está reservada a perfiles de Contraloría o Administración Institucional.
          </div>
        </div>
      )}

      {savedNotice && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              Calibración persistida en la tabla <code className="font-mono">detection_config</code> y registrada en <code className="font-mono">audit_log</code>. Todos los gráficos e inspectores ya utilizan estos nuevos valores.
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
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-6 space-y-5 shadow-xs">
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-outline-variant/25">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-bold text-on-surface">
                      Ponderación por Familia de Riesgo
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Multiplicador aplicado a cada motor analítico (Isolation Forest, PACC y Grafos)
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-lg bg-surface-container-high text-xs font-mono font-semibold text-on-surface shrink-0">
                  Multiplicador
                </span>
              </div>

              <div className="space-y-4">
                {weightsList.map((param) => {
                  const currentVal = draftValues[param.key] ?? param.value
                  const isModified = Math.abs(currentVal - param.default_value) > 0.001
                  return (
                    <div
                      key={param.key}
                      className={`p-4 rounded-xl border transition-colors space-y-3 ${
                        isModified
                          ? "bg-primary/5 border-primary/40"
                          : "bg-surface-container-low/60 border-outline-variant/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-on-surface">{param.label}</p>
                            {isModified && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                                Modificado
                              </span>
                            )}
                          </div>
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

            <div className="lg:col-span-6 bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-6 space-y-5 shadow-xs">
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-outline-variant/25">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-bold text-on-surface">
                      Sensibilidad Estadística y Ventana PACC
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Puntos de corte para clasificar severidad crítica, sobreprecio y ventana temporal
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-lg bg-surface-container-high text-xs font-mono font-semibold text-on-surface shrink-0">
                  Corte Operativo
                </span>
              </div>

              <div className="space-y-4">
                {coreThresholdsList.map((param) => {
                  const currentVal = draftValues[param.key] ?? param.value
                  const isModified = Math.abs(currentVal - param.default_value) > 0.001
                  return (
                    <div
                      key={param.key}
                      className={`p-4 rounded-xl border transition-colors space-y-3 ${
                        isModified
                          ? "bg-primary/5 border-primary/40"
                          : "bg-surface-container-low/60 border-outline-variant/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-on-surface">{param.label}</p>
                            {isModified && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                                Modificado
                              </span>
                            )}
                          </div>
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

          <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-6 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-outline-variant/25">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-on-surface">
                    Matriz de Umbrales por Modalidad de Contratación DGCP (Ley 340-06 · Reg. 416-23)
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Cada proceso toma automáticamente el umbral de su sigla (<code className="font-mono">-CD-</code>, <code className="font-mono">-CM-</code>, <code className="font-mono">-CP-</code>, <code className="font-mono">-PEIN-</code>, <code className="font-mono">-LPN-</code>, <code className="font-mono">-PEEN-</code>) desde esta tabla en PostgreSQL. Al cambiar un monto aquí, todos los gráficos de fraccionamiento se actualizan al instante.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold shrink-0">
                100% Persistido en BD ({dgcpModalityList.length} Modalidades)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dgcpModalityList.map((param) => {
                const currentVal = draftValues[param.key] ?? param.value
                const isModified = Math.abs(currentVal - param.default_value) > 1
                const badgeInfo = MODALITY_SIGLA_BADGES[param.key] || {
                  code: param.key,
                  lawRef: "Ley 340-06",
                }
                return (
                  <div
                    key={param.key}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-4 ${
                      isModified
                        ? "bg-primary/5 border-primary/40 shadow-xs"
                        : "bg-surface-container-low/60 border-outline-variant/30"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-surface-container-high font-mono text-[11px] font-bold text-primary">
                          Sigla: {badgeInfo.code}
                        </span>
                        <span className="text-[10px] font-mono text-on-surface-variant">
                          {badgeInfo.lawRef}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-on-surface leading-snug">
                        {param.label}
                      </p>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed">
                        {param.description}
                      </p>
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-outline-variant/20">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
                          Tope Vigente (DOP)
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-primary">RD$</span>
                          <input
                            type="number"
                            disabled={!canEdit}
                            min={param.min}
                            max={param.max}
                            step={param.step}
                            value={currentVal}
                            onChange={(e) => handleValueChange(param.key, parseFloat(e.target.value))}
                            className="w-32 px-2.5 py-1 rounded-lg bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/40 font-mono text-xs font-bold text-right text-on-surface focus:outline-none focus:border-primary disabled:opacity-60"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
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
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-on-surface-variant">
                        <span>Base: RD$ {param.default_value.toLocaleString("es-DO")}</span>
                        <span>Máx: RD$ {param.max.toLocaleString("es-DO")}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}