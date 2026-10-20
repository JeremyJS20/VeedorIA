import {
  FileBarChart,
  Download,
  Printer,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Building2,
} from "lucide-react"
import { useComplianceReportSummary } from "../hooks/useAuditorB2G"

function formatDopCompact(val: number): string {
  if (val >= 1_000_000_000) return `RD$ ${(val / 1_000_000_000).toFixed(2)}B`
  if (val >= 1_000_000) return `RD$ ${(val / 1_000_000).toFixed(2)}M`
  if (val >= 1_000) return `RD$ ${(val / 1_000).toFixed(1)}K`
  return `RD$ ${val.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`
}

export default function ComplianceReportsPage() {
  const { data, isLoading } = useComplianceReportSummary()

  const kpis = data?.kpis || {
    total_processes: 0,
    total_contracts: 0,
    total_amount: 0,
    total_anomalies: 0,
    critical_count: 0,
    pending_count: 0,
    confirmed_count: 0,
    dismissed_count: 0,
    exposed_amount: 0,
    resolution_rate_pct: 100,
  }
  const breakdown = data?.breakdown_by_type || []
  const topFindings = data?.top_findings || []

  const handleDownloadCsv = () => {
    if (!data) return
    const headers = [
      "Proceso",
      "Organismo",
      "Proveedor",
      "Tipologia",
      "Severidad_Pct",
      "Estado",
      "Monto_DOP",
    ]
    const rows = topFindings.map((f) => [
      `"${f.process_code.replace(/"/g, '""')}"`,
      `"${f.institution_name.replace(/"/g, '""')}"`,
      `"${f.supplier_name.replace(/"/g, '""')}"`,
      `"${f.anomaly_type_label.replace(/"/g, '""')}"`,
      Math.round(f.severity * 100),
      `"${f.status_label}"`,
      f.amount.toFixed(2),
    ])
    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `informe_cumplimiento_veedoria_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 sm:p-8 max-w-[80rem] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">
            Reportes de Cumplimiento
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Consolidado ejecutivo de fiscalización, distribución por tipología de hallazgo y exportación de actas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!data}
            onClick={handleDownloadCsv}
            className="h-10 px-4 rounded-lg border border-outline-variant/40 bg-surface text-xs font-semibold text-on-surface hover:bg-surface-container-high flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="h-10 px-4 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Acta Ejecutiva
          </button>
        </div>
      </div>

      {/* Encabezado Formal de Acta */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-outline-variant/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">
                Acta Resumen de Veeduría y Control Preventivo
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Entidad: <strong className="text-on-surface">{data?.organization_name || "—"}</strong> · Alcance:{" "}
                <strong className="text-on-surface">{data?.scope_label || "—"}</strong>
              </p>
            </div>
          </div>

          <div className="text-xs text-on-surface-variant lg:text-right">
            <div>
              Emitido por: <strong className="text-on-surface">{data?.prepared_by || "—"}</strong>
            </div>
            <div className="font-mono mt-0.5">{data?.generated_at || "—"}</div>
          </div>
        </div>

        {/* KPIs del Informe */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-surface border border-outline-variant/25 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1.5">
              <span>Procesos y Contratos</span>
              <FileBarChart className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl font-bold font-mono text-on-surface">
              {kpis.total_processes.toLocaleString("es-DO")} / {kpis.total_contracts.toLocaleString("es-DO")}
            </p>
            <p className="text-[11px] text-on-surface-variant mt-1">
              Total contratado: {formatDopCompact(kpis.total_amount)}
            </p>
          </div>

          <div className="bg-surface border border-outline-variant/25 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1.5">
              <span>Hallazgos Detectados</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xl font-bold font-mono text-on-surface">
              {kpis.total_anomalies.toLocaleString("es-DO")} ({kpis.critical_count} críticos)
            </p>
            <p className="text-[11px] text-on-surface-variant mt-1">
              Exposición en revisión: {formatDopCompact(kpis.exposed_amount)}
            </p>
          </div>

          <div className="bg-surface border border-outline-variant/25 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1.5">
              <span>Dictámenes Emitidos</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xl font-bold font-mono text-on-surface">
              {kpis.confirmed_count} conf. · {kpis.dismissed_count} desest.
            </p>
            <p className="text-[11px] text-on-surface-variant mt-1">
              Pendientes de revisión: {kpis.pending_count}
            </p>
          </div>

          <div className="bg-surface border border-outline-variant/25 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1.5">
              <span>Tasa de Resolución</span>
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl font-bold font-mono text-primary">
              {kpis.resolution_rate_pct}%
            </p>
            <p className="text-[11px] text-on-surface-variant mt-1">
              Porcentaje de alertas dictaminadas
            </p>
          </div>
        </div>
      </div>

      {/* Desglose por Tipología */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-outline-variant/20">
          <h2 className="text-base font-bold text-on-surface">
            Distribución por Tipología de Riesgo
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Resumen cuantitativo de alertas agrupadas según la naturaleza de la señal preventiva.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/25 bg-surface-container/50 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="py-3 px-4">Categoría de Hallazgo</th>
                <th className="py-3 px-4 text-center">Alertas Totales</th>
                <th className="py-3 px-4 text-center">Confirmadas</th>
                <th className="py-3 px-4 text-center">Pendientes</th>
                <th className="py-3 px-4 text-right">Monto Involucrado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-on-surface-variant">
                    Generando consolidado por tipología...
                  </td>
                </tr>
              ) : breakdown.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-on-surface-variant">
                    No existen hallazgos registrados en el alcance actual.
                  </td>
                </tr>
              ) : (
                breakdown.map((b) => (
                  <tr key={b.anomaly_type} className="hover:bg-surface-container-high/40">
                    <td className="py-3 px-4 font-semibold text-on-surface">{b.label}</td>
                    <td className="py-3 px-4 text-center font-mono text-xs">{b.count}</td>
                    <td className="py-3 px-4 text-center font-mono text-xs text-red-600 dark:text-red-400 font-semibold">
                      {b.confirmed}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs text-amber-600 dark:text-amber-400">
                      {b.pending}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-on-surface">
                      RD$ {b.amount.toLocaleString("es-DO", { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Principales Hallazgos Incluidos en el Acta */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-outline-variant/20">
          <h2 className="text-base font-bold text-on-surface">
            Anexo de Principales Hallazgos por Severidad
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Expedientes prioritarios incluidos en la exportación oficial del informe.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/25 bg-surface-container/50 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="py-3 px-4">Código de Proceso</th>
                <th className="py-3 px-4">Organismo</th>
                <th className="py-3 px-4">Proveedor Adjudicatario</th>
                <th className="py-3 px-4">Tipología</th>
                <th className="py-3 px-4 text-center">Severidad</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 text-sm">
              {topFindings.map((f) => (
                <tr key={f.id} className="hover:bg-surface-container-high/40">
                  <td className="py-3 px-4 font-mono text-xs font-semibold text-primary">
                    {f.process_code}
                  </td>
                  <td className="py-3 px-4 text-xs text-on-surface-variant">
                    {f.institution_name}
                  </td>
                  <td className="py-3 px-4 text-xs font-medium text-on-surface">
                    {f.supplier_name}
                  </td>
                  <td className="py-3 px-4 text-xs text-on-surface-variant">
                    {f.anomaly_type_label}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                    {Math.round(f.severity * 100)}%
                  </td>
                  <td className="py-3 px-4 text-xs text-on-surface">{f.status_label}</td>
                  <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-on-surface">
                    RD$ {f.amount.toLocaleString("es-DO", { maximumFractionDigits: 0 })}
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
