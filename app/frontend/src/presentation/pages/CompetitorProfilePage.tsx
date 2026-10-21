import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Lock,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react"
import { useCompetitorsList, useCompetitorProfile } from "../hooks/useB2BSuite"
import { ProcessInspectorDrawer } from "../components/ConsoleInspectorDrawers"
import { useAuth } from "../context/AuthContext"
import { resolvePlanLock } from "../../domain/previewProfiles"

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

export default function CompetitorProfilePage() {
  const { rnc: paramRnc } = useParams<{ rnc?: string }>()
  const navigate = useNavigate()
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null)

  const activeRnc = paramRnc || "132993"
  const { data: competitorsList } = useCompetitorsList()
  const { data: profile, isLoading } = useCompetitorProfile(activeRnc)

  const supplier = profile?.supplier
  const kpis = profile?.kpis
  const forensic = profile?.forensic_intelligence
  const { user, isPreviewing } = useAuth()
  const forensicLocked = resolvePlanLock(Boolean(forensic?.locked), "forensic", {
    isPreviewing,
    planTier: user?.tenant?.plan_tier,
  })
  const topInstitutions = profile?.top_institutions || []
  const recentContracts = profile?.recent_contracts || []

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 sm:p-8 max-w-[80rem] mx-auto space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-on-surface">
                Ficha Forense y Comercial de Competidor
              </h1>
              <p className="text-xs text-on-surface-variant mt-1">
                Trayectoria de adjudicaciones, compradores recurrentes y posicionamiento de precios de empresas del sector.
              </p>
            </div>

            <div className="w-full lg:w-[440px]">
              <label
                htmlFor="competitor-select"
                className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5"
              >
                Proveedor del Estado (RPE / RNC)
              </label>
              <select
                id="competitor-select"
                value={activeRnc}
                onChange={(e) => navigate(`/app/competidor/${e.target.value}`)}
                className="w-full h-11 px-3.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container-high border border-outline-variant text-xs font-semibold text-on-surface focus:outline-none focus:border-primary cursor-pointer"
              >
                {(competitorsList || []).map((comp) => (
                  <option key={comp.rpe} value={comp.rpe}>
                    {comp.name} (RPE #{comp.rpe})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-28 rounded-2xl bg-surface-container-low animate-pulse border border-outline-variant/25"
                />
              ))}
            </div>
          ) : !profile ? (
            <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-12 text-center text-xs text-on-surface-variant">
              No se encontró expediente para el proveedor seleccionado.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-primary rounded-2xl p-5 flex flex-col justify-between shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Razón Social · RPE #{supplier?.rpe}
                  </span>
                  <div className="mt-2.5 space-y-1">
                    <p className="font-display text-base font-bold text-on-surface line-clamp-1">
                      {supplier?.name}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {supplier?.province || "República Dominicana"} ·{" "}
                      {supplier?.is_mipyme ? "MiPyME Certificada" : "Proveedor General"}
                    </p>
                  </div>
                </div>

                <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-primary rounded-2xl p-5 flex flex-col justify-between shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Volumen Total Adjudicado
                  </span>
                  <div className="mt-2.5 space-y-1">
                    <p className="font-mono text-2xl font-bold text-primary tracking-tight">
                      {formatCompactDop(kpis?.total_adjudicated_dop ?? 0)}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {(kpis?.contracts_won ?? 0).toLocaleString("es-DO")} contratos ganados
                    </p>
                  </div>
                </div>

                <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-outline-variant rounded-2xl p-5 flex flex-col justify-between shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Contrato Promedio
                  </span>
                  <div className="mt-2.5 space-y-1">
                    <p className="font-mono text-2xl font-bold text-on-surface tracking-tight">
                      {formatCompactDop(kpis?.avg_contract_dop ?? 0)}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      En {kpis?.institutions_count ?? 0} instituciones compradoras
                    </p>
                  </div>
                </div>

                <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-emerald-500 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Estado Registral DGCP
                  </span>
                  <div className="mt-2.5 space-y-1">
                    <p className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                      {supplier?.status || "ACTIVO"}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Registro de Proveedores del Estado
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-6 space-y-5 shadow-xs">
                  <div>
                    <h2 className="font-display text-base font-bold text-on-surface">
                      Principales Instituciones Compradoras
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Unidades de compra con mayor facturación histórica hacia este proveedor
                    </p>
                  </div>

                  <div className="space-y-3">
                    {topInstitutions.map((inst) => (
                      <div
                        key={inst.institution_id}
                        className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/25 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs gap-2">
                          <span className="font-bold text-on-surface truncate">
                            {inst.institution_name}
                          </span>
                          <span className="font-mono font-bold text-primary shrink-0">
                            {inst.contracts_count} contr.
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-on-surface-variant">
                          <span>{inst.contracts_count} adjudicaciones</span>
                          <span className="font-semibold text-on-surface">
                            {formatCompactDop(inst.total_amount_dop)}
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-surface-container-high overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.min(100, Math.max(15, inst.contracts_count * 12))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-7 bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-6 space-y-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <h2 className="font-display text-base font-bold text-on-surface">
                      Inteligencia Forense y Posicionamiento de Precios
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Desviación de precios ofertados frente a la mediana del rubro y alertas de integridad
                    </p>
                  </div>

                  {forensicLocked ? (
                    <div className="py-12 px-5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-center space-y-3 my-auto">
                      <Lock className="w-6 h-6 text-amber-600 mx-auto" />
                      <p className="text-xs font-bold text-on-surface">
                        Inteligencia Forense de Competidores Restringida
                      </p>
                      <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                        Actualice al{" "}
                        <span className="font-semibold text-primary">
                          {forensic?.required_plan_label ?? "Plan Proveedor Corporativo"}
                        </span>{" "}
                        para desbloquear el comparativo de precios unitarios por rubro UNSPSC y las banderas forenses de este competidor.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("/app/suscripcion")}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-95 transition-opacity cursor-pointer"
                      >
                        <span>Actualizar a Plan Corporativo</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="space-y-2.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                          Comparativa de Precios Unitarios vs. Mediana del Mercado
                        </p>
                        {(forensic?.shared_unspsc_pricing || []).map((row) => (
                          <div
                            key={row.unspsc_family}
                            className="p-3.5 rounded-xl bg-surface-container-low/60 border border-outline-variant/25 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
                          >
                            <div>
                              <span className="font-bold text-on-surface">{row.unspsc_label}</span>
                              <p className="text-[11px] font-mono text-on-surface-variant mt-0.5">
                                Mediana sector: {formatDop(row.market_median_unit_price_dop)} · Competidor:{" "}
                                <strong className="text-on-surface">
                                  {formatDop(row.competitor_median_unit_price_dop)}
                                </strong>
                              </p>
                            </div>
                            <span
                              className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 ${
                                row.price_delta_pct < 0
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                  : row.price_delta_pct > 10
                                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                    : "bg-primary/15 text-primary"
                              }`}
                            >
                              {row.price_delta_pct > 0 ? `+${row.price_delta_pct}%` : `${row.price_delta_pct}%`} ({row.contracts_in_family} contr.)
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                          Señales de Auditoría Asociadas ({(forensic?.risk_flags || []).length})
                        </p>
                        {(forensic?.risk_flags || []).length === 0 ? (
                          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>Sin hallazgos de anomalía registrados en los contratos analizados.</span>
                          </div>
                        ) : (
                          (forensic?.risk_flags || []).map((anom) => (
                            <div
                              key={anom.anomaly_id}
                              className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1 text-xs"
                            >
                              <div className="flex items-center justify-between font-mono font-bold text-amber-700 dark:text-amber-300">
                                <span className="inline-flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  {anom.anomaly_type} · {anom.process_code}
                                </span>
                                <span>Severidad {Math.round((anom.severity || 0) * 100)}%</span>
                              </div>
                              <p className="text-on-surface-variant">{anom.description}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-outline-variant/25 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="font-display text-base font-bold text-on-surface">
                      Historial de Contratos Adjudicados al Competidor
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Procedimientos adjudicados con acceso directo al expediente institucional
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-surface-container-high text-xs font-mono font-semibold text-on-surface shrink-0">
                    {recentContracts.length} contratos recientes
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/25 bg-surface-container-low/60 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                        <th className="py-3 px-5">Contrato / Proceso</th>
                        <th className="py-3 px-5">Objeto de Contratación</th>
                        <th className="py-3 px-5">Institución Compradora</th>
                        <th className="py-3 px-5 text-right">Monto Adjudicado</th>
                        <th className="py-3 px-5 text-right">Expediente</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20 text-xs">
                      {recentContracts.map((c) => (
                        <tr
                          key={c.contract_id}
                          className="hover:bg-surface-container-low/50 transition-colors"
                        >
                          <td className="py-3.5 px-5 font-mono font-semibold text-primary whitespace-nowrap">
                            {c.contract_id}
                            <span className="block text-[11px] font-normal text-on-surface-variant">
                              {c.process_code} · {c.signed_date}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 font-medium text-on-surface max-w-[340px]">
                            <p className="line-clamp-2">{c.title}</p>
                          </td>
                          <td className="py-3.5 px-5 text-on-surface-variant max-w-[240px] truncate">
                            {c.institution_name}
                          </td>
                          <td className="py-3.5 px-5 text-right font-mono font-bold text-on-surface whitespace-nowrap">
                            {formatDop(c.amount_dop)}
                          </td>
                          <td className="py-3.5 px-5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedProcessId(c.process_id)}
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
            </>
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
