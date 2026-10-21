import { useMemo, useState } from "react"
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileJson,
  Loader2,
  Search,
  X,
} from "lucide-react"
import { useAuditLogs, useExportAuditLogs } from "../hooks/useAdminOps"
import type { AuditLogFilters, AuditLogRow } from "../hooks/useAdminOps"

const KNOWN_ACTIONS = [
  "ANOMALY_REVIEW",
  "SYNC_TRIGGERED",
  "DETECTION_TRIGGERED",
  "UPDATE_DETECTION_CONFIG",
  "DETECTION_CONFIG_RESET",
  "CALIBRATION_APPLY",
  "AUDIT_LOG_EXPORT",
  "TICKET_CREATED",
  "TICKET_STATUS_CHANGED",
  "TICKET_ASSIGNED",
  "TICKET_REPLIED",
  "TICKET_REOPENED",
  "B2B_BID_UPSERT",
  "B2B_BID_DELETE",
  "CREATE_INTEGRATION_KEY",
  "REVOKE_INTEGRATION_KEY",
]

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
    second: "2-digit",
  })
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return "—"
  if (typeof value === "string") return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function DiffBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-outline">{label}</span>
      <pre className="max-h-48 overflow-auto rounded-xl bg-surface-container-high/60 p-3 font-mono text-[11px] text-on-surface whitespace-pre-wrap break-all">
        {renderValue(value)}
      </pre>
    </div>
  )
}

export default function AuditLogPage() {
  const [filters, setFilters] = useState<AuditLogFilters>({ page: 1, limit: 25 })
  const [selected, setSelected] = useState<AuditLogRow | null>(null)
  const [exportInfo, setExportInfo] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  const { data, isLoading, error, isFetching } = useAuditLogs(filters)
  const exportMutation = useExportAuditLogs()

  const totalPages = useMemo(() => {
    if (!data || data.limit === 0) return 1
    return Math.max(1, Math.ceil(data.total / data.limit))
  }, [data])

  const updateFilter = (key: keyof AuditLogFilters, value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: value === "" ? undefined : value,
      page: key === "page" || key === "limit" ? current.page : 1,
    }))
    setExportInfo(null)
    setExportError(null)
  }

  const clearFilters = () => {
    setFilters({ page: 1, limit: 25 })
    setExportInfo(null)
    setExportError(null)
  }

  const runExport = async (format: "csv" | "json") => {
    setExportInfo(null)
    setExportError(null)
    try {
      const result = await exportMutation.mutateAsync({ format, filters })
      setExportInfo(
        `Exportación ${format.toUpperCase()} generada${
          result.checksum ? ` · SHA-256: ${result.checksum.slice(0, 16)}…` : ""
        }`
      )
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "No fue posible exportar la bitácora.")
    }
  }

  const diffRows = useMemo(() => {
    if (!selected) return []
    const before = asRecord(selected.old_value) ?? {}
    const after = asRecord(selected.new_value) ?? {}
    const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).filter(
      (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key])
    )
    return keys.map((key) => ({ key, before: before[key], after: after[key] }))
  }, [selected])

  return (
    <div className="p-6 sm:p-8 max-w-[90rem] mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">Bitácora Inmutable del Sistema</h1>
          <p className="text-xs text-on-surface-variant mt-1 max-w-3xl">
            Registro append-only de todas las acciones sensibles de la plataforma. Solo lectura: no existe edición
            ni borrado de entradas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => runExport("csv")}
            disabled={exportMutation.isPending}
            className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-outline-variant/35 text-xs font-semibold text-on-surface-variant hover:text-primary disabled:opacity-40"
          >
            {exportMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            CSV
          </button>
          <button
            type="button"
            onClick={() => runExport("json")}
            disabled={exportMutation.isPending}
            className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-outline-variant/35 text-xs font-semibold text-on-surface-variant hover:text-primary disabled:opacity-40"
          >
            <FileJson className="w-4 h-4" />
            JSON
          </button>
        </div>
      </div>

      {exportInfo && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
          {exportInfo} · La exportación quedó auditada como AUDIT_LOG_EXPORT.
        </div>
      )}

      {exportError && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-[11px] font-semibold text-rose-800 dark:text-rose-300">
          {exportError}
        </div>
      )}

      {/* Filtros */}
      <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <label className="space-y-1.5 block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Tipo de acción
            </span>
            <input
              list="audit-actions"
              value={filters.action_type ?? ""}
              onChange={(event) => updateFilter("action_type", event.target.value)}
              placeholder="ANOMALY_REVIEW…"
              className="w-full h-10 px-3 rounded-xl border border-outline-variant/35 bg-surface-container-lowest dark:bg-surface-container font-mono text-xs text-on-surface"
            />
            <datalist id="audit-actions">
              {KNOWN_ACTIONS.map((action) => (
                <option key={action} value={action} />
              ))}
            </datalist>
          </label>

          <label className="space-y-1.5 block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Usuario (ID)
            </span>
            <input
              value={filters.user_id ?? ""}
              onChange={(event) => updateFilter("user_id", event.target.value)}
              placeholder="6"
              className="w-full h-10 px-3 rounded-xl border border-outline-variant/35 bg-surface-container-lowest dark:bg-surface-container font-mono text-xs text-on-surface"
            />
          </label>

          <label className="space-y-1.5 block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Entidad
            </span>
            <input
              value={filters.entity_type ?? ""}
              onChange={(event) => updateFilter("entity_type", event.target.value)}
              placeholder="anomaly"
              className="w-full h-10 px-3 rounded-xl border border-outline-variant/35 bg-surface-container-lowest dark:bg-surface-container font-mono text-xs text-on-surface"
            />
          </label>

          <label className="space-y-1.5 block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              ID de entidad
            </span>
            <input
              value={filters.entity_id ?? ""}
              onChange={(event) => updateFilter("entity_id", event.target.value)}
              placeholder="34"
              className="w-full h-10 px-3 rounded-xl border border-outline-variant/35 bg-surface-container-lowest dark:bg-surface-container font-mono text-xs text-on-surface"
            />
          </label>

          <label className="space-y-1.5 block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Desde</span>
            <input
              type="date"
              value={filters.date_from ?? ""}
              onChange={(event) => updateFilter("date_from", event.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-outline-variant/35 bg-surface-container-lowest dark:bg-surface-container font-mono text-xs text-on-surface"
            />
          </label>

          <label className="space-y-1.5 block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Hasta</span>
            <input
              type="date"
              value={filters.date_to ?? ""}
              onChange={(event) => updateFilter("date_to", event.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-outline-variant/35 bg-surface-container-lowest dark:bg-surface-container font-mono text-xs text-on-surface"
            />
          </label>

          <label className="space-y-1.5 block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Filas por página
            </span>
            <select
              value={filters.limit ?? 25}
              onChange={(event) => updateFilter("limit", event.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-outline-variant/35 bg-surface-container-lowest dark:bg-surface-container text-xs text-on-surface"
            >
              {[25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={clearFilters}
              className="h-10 w-full px-3 rounded-xl border border-outline-variant/35 text-xs font-semibold text-on-surface-variant hover:text-primary"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-xs text-rose-800 dark:text-rose-300 font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            {error instanceof Error ? error.message : "No fue posible consultar la bitácora."}
          </span>
        </div>
      )}

      {/* Tabla */}
      <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-on-surface">Registro de auditoría</h2>
          </div>
          <span className="text-[11px] font-mono text-on-surface-variant">
            {data?.total ?? 0} entradas · página {data?.page ?? 1} de {totalPages}
            {isFetching ? " · actualizando…" : ""}
          </span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-10 rounded-xl bg-surface-container-high animate-pulse" />
            ))}
          </div>
        ) : (data?.items?.length ?? 0) === 0 ? (
          <p className="p-8 text-center text-xs text-on-surface-variant">
            No hay entradas que coincidan con los filtros seleccionados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-on-surface-variant bg-surface-container-high/60">
                  <th className="px-4 py-2.5 font-bold">Fecha</th>
                  <th className="px-4 py-2.5 font-bold">Acción</th>
                  <th className="px-4 py-2.5 font-bold">Actor</th>
                  <th className="px-4 py-2.5 font-bold">Entidad</th>
                  <th className="px-4 py-2.5 font-bold">IP</th>
                  <th className="px-4 py-2.5 font-bold text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {data?.items?.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-surface-container-high/40 transition-colors cursor-pointer"
                    onClick={() => setSelected(row)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-on-surface-variant">
                      {formatDateTime(row.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 rounded-lg bg-primary/10 text-primary font-mono text-[10px] font-bold">
                        {row.action_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-on-surface">{row.user_email ?? "—"}</span>
                        <span className="font-mono text-[10px] text-on-surface-variant">
                          {row.user_id ?? "sistema"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-on-surface-variant">
                      {row.entity_type ?? "—"}
                      {row.entity_id ? ` · ${row.entity_id}` : ""}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-on-surface-variant">
                      {row.ip_address ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          setSelected(row)
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-outline-variant/35 text-[11px] font-semibold text-on-surface-variant hover:text-primary"
                      >
                        <Eye className="w-3 h-3" />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-3 border-t border-outline-variant/20 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, (current.page ?? 1) - 1) }))}
            disabled={(filters.page ?? 1) <= 1}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-outline-variant/35 text-[11px] font-semibold text-on-surface-variant disabled:opacity-40"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Anterior
          </button>
          <span className="text-[11px] font-mono text-on-surface-variant">
            {(filters.page ?? 1) * (filters.limit ?? 25) - (filters.limit ?? 25) + 1}–
            {Math.min((filters.page ?? 1) * (filters.limit ?? 25), data?.total ?? 0)} de {data?.total ?? 0}
          </span>
          <button
            type="button"
            onClick={() => setFilters((current) => ({ ...current, page: (current.page ?? 1) + 1 }))}
            disabled={(filters.page ?? 1) >= totalPages}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-outline-variant/35 text-[11px] font-semibold text-on-surface-variant disabled:opacity-40"
          >
            Siguiente
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Drawer de detalle */}
      {selected && (
        <div className="fixed inset-0 z-[130] flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <aside className="relative h-full w-full max-w-xl bg-surface-container-lowest dark:bg-surface-container border-l border-outline-variant/35 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-surface-container-lowest dark:bg-surface-container px-5 py-4 border-b border-outline-variant/20 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-on-surface">{selected.action_type}</h3>
                <p className="text-[11px] font-mono text-on-surface-variant mt-0.5">
                  #{selected.id} · {formatDateTime(selected.timestamp)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                {[
                  { label: "Actor", value: selected.user_email ?? selected.user_id ?? "sistema" },
                  { label: "IP", value: selected.ip_address ?? "—" },
                  { label: "Entidad", value: selected.entity_type ?? "—" },
                  { label: "ID entidad", value: selected.entity_id ?? "—" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-outline-variant/25 p-3">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-outline">
                      {item.label}
                    </span>
                    <span className="font-mono text-on-surface break-all">{item.value}</span>
                  </div>
                ))}
              </div>

              {diffRows.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-outline">
                    Cambios detectados ({diffRows.length})
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-outline-variant/25">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="bg-surface-container-high/60 text-left">
                          <th className="px-3 py-2 font-bold text-on-surface-variant">Campo</th>
                          <th className="px-3 py-2 font-bold text-on-surface-variant">Antes</th>
                          <th className="px-3 py-2 font-bold text-on-surface-variant">Después</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/15">
                        {diffRows.map((row) => (
                          <tr key={row.key}>
                            <td className="px-3 py-2 font-mono text-on-surface">{row.key}</td>
                            <td className="px-3 py-2 font-mono text-rose-600 dark:text-rose-400 break-all">
                              {renderValue(row.before)}
                            </td>
                            <td className="px-3 py-2 font-mono text-emerald-600 dark:text-emerald-400 break-all">
                              {renderValue(row.after)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-on-surface-variant">
                  Sin diff estructurado: la entrada contiene valores planos o solo uno de los lados.
                </p>
              )}

              <DiffBlock label="old_value" value={selected.old_value} />
              <DiffBlock label="new_value" value={selected.new_value} />
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
