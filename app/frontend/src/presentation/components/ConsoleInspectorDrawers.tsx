import { Building2, FileText, AlertTriangle, ArrowUpRight, CheckCircle2 } from "lucide-react"
import { useProcessDossier } from "../hooks/useAuditorB2G"
import { usePublicSupplierProfile } from "../hooks/usePublicPortal"
import type { Anomaly } from "../../domain/anomaly"
import Drawer from "./ui/Drawer"

function formatDop(val: number): string {
  return `RD$ ${(val || 0).toLocaleString("es-DO", { maximumFractionDigits: 0 })}`
}

export function ProcessInspectorDrawer({
  processId,
  onClose,
  onSelectAnomaly,
}: {
  processId: number
  onClose: () => void
  onSelectAnomaly: (anomaly: Anomaly) => void
}) {
  const { data, isLoading } = useProcessDossier(processId)

  return (
    <Drawer
      open
      onClose={onClose}
      maxWidth="sm:w-[520px] lg:w-[580px]"
      bodyClassName="overflow-y-auto p-6"
      title={
        <>
          <span className="block text-[10px] font-bold text-outline uppercase tracking-widest">
            Expediente Institucional de Proceso
          </span>
          <span className="font-display font-bold text-primary text-lg font-mono">
            {data?.process_code || `PROC-${processId}`}
          </span>
        </>
      }
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="py-12 text-center font-mono text-xs text-on-surface-variant">
            Cargando expediente del proceso...
          </div>
        ) : !data ? (
          <div className="py-12 text-center text-xs text-on-surface-variant">
            No se encontró información detallada para este expediente.
          </div>
        ) : (
          <>
            {/* Resumen del Proceso */}
            <div className="p-4 rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 space-y-3">
              <h3 className="font-display text-sm font-bold text-on-surface leading-snug">
                {data.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{data.institution_name}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-outline-variant/20">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                    Monto Adjudicado
                  </span>
                  <span className="font-mono text-sm font-bold text-primary">
                    {formatDop(data.total_amount)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                    Contratos / Hallazgos
                  </span>
                  <span className="font-mono text-sm font-bold text-on-surface">
                    {data.contracts.length} contr. · {data.anomalies.length} alerta(s)
                  </span>
                </div>
              </div>
            </div>

            {/* Hallazgos Preventivos Asociados */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Hallazgos y Señales Preventivas ({data.anomalies.length})
                </h4>
              </div>

              {data.anomalies.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Este procedimiento no registra alertas de anomalía activas.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {data.anomalies.map((anom) => (
                    <div
                      key={anom.id}
                      className="p-4 rounded-xl bg-surface-container-low/70 border border-outline-variant/35 border-l-4 border-l-amber-500 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
                          {anom.anomaly_type_label}
                        </span>
                        <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                          Severidad {Math.round(anom.severity * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-on-surface leading-relaxed">
                        {anom.description || "Señal preventiva detectada en evaluación estadística."}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-mono text-xs font-bold text-on-surface">
                          {formatDop(anom.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onSelectAnomaly({
                              id: anom.id,
                              process_id: anom.process_id,
                              contract_id: anom.contract_id,
                              anomaly_type: anom.anomaly_type,
                              severity: anom.severity,
                              score: anom.severity,
                              reviewer_id: null,
                              dismissal_reason: null,
                              detection_metadata: null,
                              updated_at: anom.created_at ?? new Date().toISOString(),
                              confidence: anom.confidence ?? undefined,
                              signals_count: anom.signals_count ?? undefined,
                              status: anom.status,
                              description: anom.description,
                              amount: anom.amount,
                              process_code: anom.process_code,
                              supplier_name: anom.supplier_name,
                              institution_name: anom.institution_name,
                              created_at: anom.created_at ?? new Date().toISOString(),
                            })
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-95 cursor-pointer"
                        >
                          <span>Abrir Análisis Forense</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contratos Vinculados */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Contratos Adjudicados ({data.contracts.length})
              </h4>
              <div className="space-y-2.5">
                {data.contracts.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/25 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-primary flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        {c.contract_code}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-surface-container-high font-mono text-[10px] text-on-surface-variant">
                        {c.status}
                      </span>
                    </div>
                    <div className="font-semibold text-on-surface">{c.supplier_name}</div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-on-surface-variant pt-1">
                      <span>RPE: {c.rpe} · {c.signed_date}</span>
                      <strong className="text-on-surface">{formatDop(c.amount)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Drawer>
  )
}

export function SupplierInspectorDrawer({
  rpe,
  onClose,
}: {
  rpe: string
  onClose: () => void
}) {
  const { data, isLoading } = usePublicSupplierProfile(rpe)

  return (
    <Drawer
      open
      onClose={onClose}
      maxWidth="sm:w-[520px] lg:w-[580px]"
      bodyClassName="overflow-y-auto p-6"
      title={
        <>
          <span className="block text-[10px] font-bold text-outline uppercase tracking-widest">
            Ficha Forense de Proveedor del Estado
          </span>
          <span className="font-display font-bold text-primary text-lg">
            {data?.name || `RPE #${rpe}`}
          </span>
        </>
      }
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="py-12 text-center font-mono text-xs text-on-surface-variant">
            Consultando expediente del proveedor...
          </div>
        ) : !data ? (
          <div className="py-12 text-center text-xs text-on-surface-variant">
            No se encontró historial detallado para el RPE {rpe}.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                  Total Adjudicado
                </span>
                <p className="font-mono text-base font-bold text-primary mt-1">
                  {formatDop(data.total_adjudicated)}
                </p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  RPE / RNC: {data.rnc}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                  Contratos y Alertas
                </span>
                <p className="font-mono text-base font-bold text-on-surface mt-1">
                  {data.contracts_count} contr. · {data.anomalies_count} alerta(s)
                </p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  {data.province || "República Dominicana"} · {data.status}
                </p>
              </div>
            </div>

            {/* Principales Instituciones Compradoras */}
            {data.top_institutions.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Organismos con Mayor Concentración
                </h4>
                <div className="space-y-2">
                  {data.top_institutions.slice(0, 5).map((inst, idx) => (
                    <div
                      key={`${inst.name}-${idx}`}
                      className="p-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/25 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-on-surface truncate">{inst.name}</p>
                        <p className="text-[11px] font-mono text-on-surface-variant">
                          {inst.count} adjudicaciones
                        </p>
                      </div>
                      <span className="font-mono font-bold text-primary shrink-0">
                        {formatDop(inst.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alertas del Proveedor */}
            {data.anomalies.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Hallazgos Registrados ({data.anomalies.length})
                </h4>
                <div className="space-y-2">
                  {data.anomalies.slice(0, 5).map((a) => (
                    <div
                      key={a.id}
                      className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between font-mono font-bold text-amber-700 dark:text-amber-300">
                        <span className="inline-flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {a.anomaly_type}
                        </span>
                        <span>Severidad {Math.round(a.severity * 100)}%</span>
                      </div>
                      <p className="text-on-surface-variant leading-relaxed">{a.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contratos Recientes */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Contratos Recientes ({data.contracts.length})
              </h4>
              <div className="space-y-2">
                {data.contracts.slice(0, 8).map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/25 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] text-primary font-bold">
                      <span>{c.dgcp_code || c.contract_code}</span>
                      <span>{c.signed_date?.slice(0, 10) || "—"}</span>
                    </div>
                    <p className="font-semibold text-on-surface line-clamp-1">{c.title}</p>
                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-0.5">
                      <span className="truncate">{c.institution_name}</span>
                      <strong className="font-mono text-on-surface shrink-0">
                        {formatDop(c.amount_adjudicated)}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Drawer>
  )
}
