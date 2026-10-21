import { useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  X,
} from "lucide-react"
import { useQueueStatus, useSyncOverview, useTriggerSync } from "../hooks/useAdminOps"
import type { SyncLogRow, SyncTriggerPayload } from "../hooks/useAdminOps"

const STATUS_STYLES: Record<string, string> = {
  running: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  failed: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
}

function statusLabel(status: string): string {
  if (status === "running") return "En ejecución"
  if (status === "completed") return "Completada"
  if (status === "failed") return "Fallida"
  return status
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

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—"
  return new Intl.NumberFormat("es-DO").format(value)
}

function StatusChip({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${
        STATUS_STYLES[status] ?? "bg-surface-container-high text-on-surface-variant border-outline-variant/35"
      }`}
    >
      {status === "running" && <Loader2 className="w-3 h-3 animate-spin" />}
      {status === "completed" && <CheckCircle2 className="w-3 h-3" />}
      {status === "failed" && <AlertTriangle className="w-3 h-3" />}
      {statusLabel(status)}
    </span>
  )
}

const EMPTY_FORM: SyncTriggerPayload = {
  full: false,
  skip_institutions: false,
  skip_processes: false,
  skip_contracts: false,
  skip_items: false,
  skip_suppliers: false,
  days_back: 90,
  rate_limit: 5,
}

const PHASES: Array<{ key: keyof SyncTriggerPayload; label: string }> = [
  { key: "skip_institutions", label: "Instituciones" },
  { key: "skip_processes", label: "Procesos" },
  { key: "skip_contracts", label: "Contratos" },
  { key: "skip_items", label: "Ítems" },
  { key: "skip_suppliers", label: "Proveedores" },
]

export default function SyncOperationsPage() {
  const { data, isLoading, error, refetch, isFetching } = useSyncOverview(10)
  const queue = useQueueStatus()
  const trigger = useTriggerSync()

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<SyncTriggerPayload>(EMPTY_FORM)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const running = data?.kpis?.running ?? null
  const redisOffline = queue.data?.redis === "OFFLINE"
  const workerDown = queue.data?.worker === "DOWN"
  const canTrigger = !running && !redisOffline && !workerDown && !trigger.isPending

  const kpis = useMemo(
    () => [
      {
        label: "Última sincronización",
        value: data?.kpis?.last_sync ? formatDateTime(data.kpis.last_sync.completed_at) : "Sin datos",
        hint: data?.kpis?.last_sync ? data.kpis.last_sync.sync_type : "Aún no hay corridas completadas",
        icon: Clock,
      },
      {
        label: "Registros sincronizados",
        value: formatNumber(data?.kpis?.records_total),
        hint: "Última corrida completada",
        icon: Database,
      },
      {
        label: "Duración promedio",
        value: `${data?.kpis?.avg_duration_s ?? 0} s`,
        hint: "Promedio de las últimas 10 corridas",
        icon: Activity,
      },
      {
        label: "Fallos (24 h)",
        value: formatNumber(data?.kpis?.failures_24h),
        hint: "Corridas con estado fallido",
        icon: AlertTriangle,
      },
    ],
    [data]
  )

  const openModal = (row?: SyncLogRow) => {
    setFeedback(null)
    if (row) {
      setForm({
        ...EMPTY_FORM,
        full: !row.sync_type?.startsWith("incremental"),
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setModalOpen(true)
  }

  const submit = async () => {
    setFeedback(null)
    try {
      const result = await trigger.mutateAsync(form)
      setModalOpen(false)
      setFeedback({
        type: "success",
        text: `Sincronización ${result.sync_type} encolada. Job: ${result.task}`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "No fue posible encolar la sincronización."
      setFeedback({ type: "error", text: message })
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-[85rem] mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">
            Sincronización DGCP y Cola de Operaciones
          </h1>
          <p className="text-xs text-on-surface-variant mt-1 max-w-3xl">
            Monitoreo en vivo de la ingesta OCDS, control de concurrencia y estado de la infraestructura
            asíncrona (arq + Redis).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-outline-variant/35 bg-surface-container-lowest dark:bg-surface-container text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => openModal()}
            disabled={!canTrigger}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-on-primary text-xs font-bold disabled:opacity-45 disabled:cursor-not-allowed hover:opacity-95 transition-opacity"
          >
            <Play className="w-4 h-4" />
            Nueva sincronización
          </button>
        </div>
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

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-xs text-rose-800 dark:text-rose-300 font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error instanceof Error ? error.message : "No fue posible cargar el estado de sincronización."}</span>
        </div>
      )}

      {running && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 font-semibold">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>
            Corrida en curso desde {formatDateTime(running.started_at)} · tipo {running.sync_type}. El panel se
            actualiza automáticamente cada 5 segundos.
          </span>
        </div>
      )}

      {/* Salud de la cola */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Redis",
            value: queue.data?.redis ?? "…",
            ok: queue.data?.redis === "OK",
          },
          {
            label: "Worker arq",
            value: queue.data?.worker ?? "…",
            ok: queue.data?.worker === "OK",
          },
          {
            label: "Profundidad de cola",
            value: formatNumber(queue.data?.queue_depth ?? 0),
            ok: true,
          },
          {
            label: "Jobs fallidos (24 h)",
            value: formatNumber(queue.data?.failed_jobs_24h ?? 0),
            ok: (queue.data?.failed_jobs_24h ?? 0) === 0,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container px-4 py-3"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
              {item.label}
            </span>
            <span
              className={`mt-1 inline-flex items-center gap-1.5 font-mono text-sm font-bold ${
                item.ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${item.ok ? "bg-emerald-500" : "bg-rose-500"}`} />
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {redisOffline && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2 text-xs text-rose-800 dark:text-rose-300 font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Redis no responde. El histórico sigue consultable, pero no es posible encolar trabajos. Verifica el
            contenedor <span className="font-mono">veedoria-redis</span> y la variable{" "}
            <span className="font-mono">REDIS_URL</span>.
          </span>
        </div>
      )}

      {!redisOffline && workerDown && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300 font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Redis está operativo, pero no hay ningún worker <span className="font-mono">arq</span> activo: los jobs
            quedarían encolados sin procesarse. Inicia el worker con{" "}
            <span className="font-mono">docker compose up -d worker</span> o{" "}
            <span className="font-mono">poetry run python -m arq src.cli.arq_worker.WorkerSettings</span>. El panel
            se actualiza automáticamente al detectarlo.
          </span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-outline-variant/35 border-l-4 border-l-primary bg-surface-container-lowest dark:bg-surface-container p-5 space-y-2 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                {kpi.label}
              </span>
              <kpi.icon className="w-4 h-4 text-outline" />
            </div>
            <p className="font-mono text-xl font-bold text-on-surface truncate">{kpi.value}</p>
            <p className="text-[11px] text-on-surface-variant">{kpi.hint}</p>
          </div>
        ))}
      </div>

      {/* Histórico de sincronizaciones */}
      <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between">
          <h2 className="text-sm font-bold text-on-surface">Histórico de sincronizaciones</h2>
          <span className="text-[11px] font-mono text-on-surface-variant">{data?.syncs?.length ?? 0} registros</span>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-10 rounded-xl bg-surface-container-high animate-pulse" />
            ))}
          </div>
        ) : (data?.syncs?.length ?? 0) === 0 ? (
          <p className="p-6 text-xs text-on-surface-variant">Todavía no hay corridas de sincronización registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-on-surface-variant bg-surface-container-high/60">
                  <th className="px-4 py-2.5 font-bold">Inicio</th>
                  <th className="px-4 py-2.5 font-bold">Tipo</th>
                  <th className="px-4 py-2.5 font-bold">Estado</th>
                  <th className="px-4 py-2.5 font-bold text-right">Registros</th>
                  <th className="px-4 py-2.5 font-bold text-right">Duración</th>
                  <th className="px-4 py-2.5 font-bold">Disparador</th>
                  <th className="px-4 py-2.5 font-bold">Detalle</th>
                  <th className="px-4 py-2.5 font-bold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {data?.syncs?.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-on-surface-variant">
                      {formatDateTime(row.started_at)}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-on-surface">{row.sync_type}</td>
                    <td className="px-4 py-3">
                      <StatusChip status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{formatNumber(row.records_synced)}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {row.duration_s === null ? "—" : `${row.duration_s} s`}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{row.triggered_by}</td>
                    <td className="px-4 py-3 max-w-[18rem]">
                      {row.error_message ? (
                        <span className="text-rose-600 dark:text-rose-400 line-clamp-2">{row.error_message}</span>
                      ) : (
                        <span className="text-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.status === "failed" ? (
                        <button
                          type="button"
                          onClick={() => openModal(row)}
                          disabled={!canTrigger}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-outline-variant/35 text-[11px] font-semibold text-on-surface-variant hover:text-primary disabled:opacity-40"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Relanzar
                        </button>
                      ) : (
                        <span className="text-on-surface-variant">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Últimas detecciones */}
      <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between">
          <h2 className="text-sm font-bold text-on-surface">Últimas corridas del motor de detección</h2>
          <span className="text-[11px] font-mono text-on-surface-variant">
            {data?.detections?.length ?? 0} registros
          </span>
        </div>
        {(data?.detections?.length ?? 0) === 0 ? (
          <p className="p-6 text-xs text-on-surface-variant">Sin corridas de detección registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-on-surface-variant bg-surface-container-high/60">
                  <th className="px-4 py-2.5 font-bold">Inicio</th>
                  <th className="px-4 py-2.5 font-bold">Estado</th>
                  <th className="px-4 py-2.5 font-bold text-right">Hallazgos</th>
                  <th className="px-4 py-2.5 font-bold text-right">Duración</th>
                  <th className="px-4 py-2.5 font-bold">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {data?.detections?.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-on-surface-variant">
                      {formatDateTime(row.started_at)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{formatNumber(row.records_synced)}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {row.duration_s === null ? "—" : `${row.duration_s} s`}
                    </td>
                    <td className="px-4 py-3 max-w-[24rem]">
                      {row.error_message ? (
                        <span className="text-rose-600 dark:text-rose-400 line-clamp-2">{row.error_message}</span>
                      ) : (
                        <span className="text-on-surface-variant">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal de disparo */}
      {modalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45" onClick={() => !trigger.isPending && setModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
              <h3 className="text-sm font-bold text-on-surface">Nueva sincronización DGCP</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={trigger.isPending}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <span className="font-bold text-on-surface">Modalidad</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: false, label: "Incremental" },
                    { value: true, label: "Completa" },
                  ].map((option) => (
                    <button
                      key={String(option.value)}
                      type="button"
                      onClick={() => setForm({ ...form, full: option.value })}
                      className={`h-10 rounded-xl border text-xs font-semibold transition-colors ${
                        form.full === option.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-outline-variant/35 text-on-surface-variant hover:border-primary/40"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {form.full && (
                <div className="space-y-1.5">
                  <span className="font-bold text-on-surface">Fases incluidas</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PHASES.map((phase) => {
                      const skipped = Boolean(form[phase.key])
                      return (
                        <label
                          key={phase.key}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-outline-variant/30 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={!skipped}
                            onChange={(event) =>
                              setForm({ ...form, [phase.key]: !event.target.checked })
                            }
                            className="accent-primary"
                          />
                          <span className="text-[11px] text-on-surface">{phase.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5 block">
                  <span className="font-bold text-on-surface">Días hacia atrás</span>
                  <input
                    type="number"
                    min={1}
                    value={form.days_back ?? 90}
                    onChange={(event) =>
                      setForm({ ...form, days_back: Number(event.target.value) || 1 })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-outline-variant/35 bg-surface-container-lowest dark:bg-surface-container text-on-surface font-mono"
                  />
                </label>
                <label className="space-y-1.5 block">
                  <span className="font-bold text-on-surface">Rate limit (req/s)</span>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={form.rate_limit}
                    onChange={(event) =>
                      setForm({ ...form, rate_limit: Number(event.target.value) || 1 })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-outline-variant/35 bg-surface-container-lowest dark:bg-surface-container text-on-surface font-mono"
                  />
                </label>
              </div>

              <p className="text-[11px] text-on-surface-variant">
                Solo puede existir una sincronización en ejecución a la vez. El job se encola en arq y recibirás
                el identificador de la tarea.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={trigger.isPending}
                className="h-10 px-4 rounded-xl border border-outline-variant/35 text-xs font-semibold text-on-surface-variant hover:text-on-surface"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={trigger.isPending}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-on-primary text-xs font-bold disabled:opacity-50"
              >
                {trigger.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {trigger.isPending ? "Encolando…" : "Confirmar y encolar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
