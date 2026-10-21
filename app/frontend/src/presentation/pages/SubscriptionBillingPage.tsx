import { useState } from "react"
import {
  Check,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from "lucide-react"
import { useSubscriptionSummary, useUpdateSubscriptionPlan } from "../hooks/useB2BSuite"

export default function SubscriptionBillingPage() {
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { data, isLoading } = useSubscriptionSummary()
  const updatePlanMutation = useUpdateSubscriptionPlan()

  const tenant = data?.tenant
  const usage = data?.usage
  const availablePlans = data?.available_plans || []
  const history = data?.history || []

  const handlePlanChange = async (targetTier: string) => {
    setSuccessMsg(null)
    setErrorMsg(null)
    try {
      await updatePlanMutation.mutateAsync({
        target_plan_tier: targetTier,
        billing_cycle: "ANUAL",
      })
      setSuccessMsg(
        `Suscripción actualizada a ${
          targetTier === "B2B_CORPORATE"
            ? "Plan Proveedor Corporativo"
            : "Plan Proveedor PyME"
        }. Los permisos y cuotas ya están vigentes en toda la plataforma.`
      )
      setTimeout(() => setSuccessMsg(null), 5000)
    } catch {
      setErrorMsg("No fue posible procesar el cambio de plan. Intente nuevamente.")
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-[80rem] mx-auto space-y-6">
      {/* Clean Unboxed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">
            Suscripción, Planes y Cuotas de Servicio
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Control en tiempo real del nivel de servicio activo, consumo de cuotas operativas y desbloqueo de módulos.
          </p>
        </div>

        {tenant && (
          <span className="px-3.5 py-1.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 text-xs font-mono font-semibold text-on-surface shrink-0">
            RPE Vinculado: #{tenant.supplier_rpe || "132993"} · Renovación: {tenant.next_renewal_date}
          </span>
        )}
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3 Quota KPI Cards matching MarketIntelligencePage */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-32 rounded-2xl bg-surface-container-low animate-pulse border border-outline-variant/25"
            />
          ))}
        </div>
      ) : (
        usage && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-primary rounded-2xl p-5 space-y-3 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
                Rubros UNSPSC Monitoreados
              </span>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-2xl font-bold text-on-surface">
                  {usage.monitored_families_used} /{" "}
                  {usage.monitored_families_limit >= 999
                    ? "Ilimitados"
                    : usage.monitored_families_limit}
                </span>
                <span className="text-xs font-mono text-primary font-semibold">
                  {usage.monitored_families_limit >= 999
                    ? "Sin tope"
                    : `${Math.min(
                        100,
                        Math.round(
                          (usage.monitored_families_used / usage.monitored_families_limit) * 100
                        )
                      )}%`}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${
                      usage.monitored_families_limit >= 999
                        ? 22
                        : Math.min(
                            100,
                            Math.round(
                              (usage.monitored_families_used / usage.monitored_families_limit) * 100
                            )
                          )
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-primary rounded-2xl p-5 space-y-3 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
                Procesos en Pipeline Comercial
              </span>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-2xl font-bold text-on-surface">
                  {usage.active_bids_used} /{" "}
                  {usage.active_bids_limit >= 999 ? "Ilimitados" : usage.active_bids_limit}
                </span>
                <span className="text-xs font-mono text-primary font-semibold">
                  {usage.active_bids_limit >= 999
                    ? "Sin tope"
                    : `${Math.min(
                        100,
                        Math.round((usage.active_bids_used / usage.active_bids_limit) * 100)
                      )}%`}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${
                      usage.active_bids_limit >= 999
                        ? 18
                        : Math.min(
                            100,
                            Math.round((usage.active_bids_used / usage.active_bids_limit) * 100)
                          )
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-emerald-500 rounded-2xl p-5 space-y-3 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
                Miembros del Equipo Autorizados
              </span>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-2xl font-bold text-on-surface">
                  {usage.team_members_used} / {usage.team_members_limit}
                </span>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  {Math.min(
                    100,
                    Math.round((usage.team_members_used / usage.team_members_limit) * 100)
                  )}
                  %
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((usage.team_members_used / usage.team_members_limit) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )
      )}

      {/* Comparativa de Planes B2B_PYME vs B2B_CORPORATE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {availablePlans.map((plan) => {
          const isCurrent = tenant?.plan_tier === plan.plan_tier
          const isCorp = plan.plan_tier === "B2B_CORPORATE"

          return (
            <div
              key={plan.plan_tier}
              className={`bg-surface-container-lowest dark:bg-surface-container border rounded-2xl p-6 flex flex-col justify-between gap-6 shadow-xs ${
                isCurrent
                  ? "border-primary/60 border-l-4 border-l-primary"
                  : "border-outline-variant/35"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary block">
                      {plan.plan_tier}
                    </span>
                    <h2 className="font-display text-lg font-bold text-on-surface mt-0.5">
                      {plan.name}
                    </h2>
                  </div>
                  {isCurrent && (
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold shrink-0">
                      Plan Activo
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1.5 pt-1">
                  <span className="font-mono text-2xl font-bold text-on-surface">
                    RD$ {plan.price_monthly_dop.toLocaleString("es-DO")}
                  </span>
                  <span className="text-xs text-on-surface-variant">/ mes (facturación anual)</span>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-outline-variant/25 text-xs">
                  <div className="flex items-center gap-2 text-on-surface">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      Rubros UNSPSC monitoreados:{" "}
                      <strong>
                        {plan.max_families >= 999 ? "Ilimitados" : `Hasta ${plan.max_families} familias`}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      Procesos activos en Pipeline:{" "}
                      <strong>
                        {plan.max_active_bids >= 999
                          ? "Ilimitados"
                          : `Hasta ${plan.max_active_bids} procesos`}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      Simulador Estadístico de Precios (Cuartiles P25 / Mediana P50 / P75)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface">
                    <Check
                      className={`w-4 h-4 shrink-0 ${
                        plan.forensic_competitor_access ? "text-emerald-500" : "text-outline"
                      }`}
                    />
                    <span>
                      Inteligencia Forense de Competidores y Matriz de Precios Unitarios:{" "}
                      <strong>
                        {plan.forensic_competitor_access
                          ? "Desbloqueado Completo"
                          : "Restringido (Solo vista general)"}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={isCurrent || updatePlanMutation.isPending}
                onClick={() => void handlePlanChange(plan.plan_tier)}
                className={`w-full h-11 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-opacity ${
                  isCurrent
                    ? "bg-surface-container-low text-on-surface-variant border border-outline-variant/30 cursor-default"
                    : "bg-primary text-on-primary hover:opacity-95 shadow-xs cursor-pointer"
                }`}
              >
                {isCurrent ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Suscripción Actualmente Activa</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {isCorp
                        ? "Activar Plan Proveedor Corporativo"
                        : "Cambiar a Plan Proveedor PyME"}
                    </span>
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Bitácora de Eventos de Suscripción */}
      <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/25">
          <h2 className="font-display text-base font-bold text-on-surface">
            Historial de Eventos de Suscripción y Cuotas
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Registro auditable de actualizaciones de nivel de servicio y configuración de rubros
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/25 bg-surface-container-low/60 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="py-3 px-5">Evento</th>
                <th className="py-3 px-5">Acción Ejecutada</th>
                <th className="py-3 px-5">Usuario / Actor</th>
                <th className="py-3 px-5 text-right">Fecha y Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-xs">
              {history.map((h) => (
                <tr key={h.event_id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-3.5 px-5 font-mono font-semibold text-primary">
                    EVT-{h.event_id}
                  </td>
                  <td className="py-3.5 px-5 font-medium text-on-surface">{h.action}</td>
                  <td className="py-3.5 px-5 font-mono text-on-surface-variant">{h.actor}</td>
                  <td className="py-3.5 px-5 text-right font-mono text-on-surface-variant">
                    {h.timestamp.slice(0, 19).replace("T", " ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
