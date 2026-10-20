import {
  Download,
  Printer,
  Building2,
} from "lucide-react"
import { useComplianceReportSummary } from "../hooks/useAuditorB2G"

function formatCompactDop(amount: number): string {
  const v = amount || 0
  if (v >= 1_000_000_000) return `RD$ ${(v / 1_000_000_000).toFixed(2)}B`
  if (v >= 1_000_000) return `RD$ ${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `RD$ ${(v / 1_000).toFixed(1)}K`
  return `RD$ ${v.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`
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
  const maxTypeAmount = Math.max(...breakdown.map((b) => b.amount), 1)

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">
            Reportes Ejecutivos de Cumplimiento
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Consolidado institucional de fiscalización, distribución por tipología de hallazgo y emisión de actas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={!data}
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/40 text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>Exportar CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-95 transition-opacity shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Acta Ejecutiva</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards matching OverviewDashboardPage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-primary rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Procesos y Contratos
          </span>
          <div className="mt-2.5 space-y-1">
            <p className="font-mono text-2xl font-bold text-on-surface tracking-tight">
              {kpis.total_processes.toLocaleString("es-DO")} / {kpis.total_contracts.toLocaleString("es-DO")}
            </p>
            <p className="text-xs text-on-surface-variant">
              Total contratado: {formatCompactDop(kpis.total_amount)}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-amber-500 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Hallazgos Detectados
          </span>
          <div className="mt-2.5 space-y-1">
            <p className="font-mono text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
              {kpis.total_anomalies.toLocaleString("es-DO")} ({kpis.critical_count} críticos)
            </p>
            <p className="text-xs text-on-surface-variant">
              Exposición en revisión: {formatCompactDop(kpis.exposed_amount)}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-outline-variant rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Dictámenes Emitidos
          </span>
          <div className="mt-2.5 space-y-1">
            <p className="font-mono text-2xl font-bold text-on-surface tracking-tight">
              {kpis.confirmed_count} conf. · {kpis.dismissed_count} desest.
            </p>
            <p className="text-xs text-on-surface-variant">
              Pendientes de revisión: {kpis.pending_count}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-primary rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Tasa de Resolución
          </span>
          <div className="mt-2.5 space-y-1">
            <p className="font-mono text-2xl font-bold text-primary tracking-tight">
              {kpis.resolution_rate_pct}%
            </p>
            <p className="text-xs text-on-surface-variant">
              Porcentaje de alertas dictaminadas
            </p>
          </div>
        </div>
      </div>

      {/* Two-Column Executive Acta & Breakdown matching MarketIntelligencePage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Distribución por Tipología con barras */}
        <div className="lg:col-span-7 bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-6 space-y-5 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold text-on-surface">
                Distribución por Tipología de Riesgo
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Volumen económico e incidencia de alertas según la naturaleza de la señal preventiva
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-surface-container-high text-xs font-mono font-semibold text-on-surface shrink-0">
              {breakdown.length} categorías
            </span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center font-mono text-xs text-on-surface-variant">
              Generando consolidado por tipología...
            </div>
          ) : breakdown.length === 0 ? (
            <div className="py-12 text-center text-xs text-on-surface-variant">
              No existen hallazgos registrados en el alcance actual.
            </div>
          ) : (
            <div className="space-y-4">
              {breakdown.map((b) => {
                const pct = Math.max(12, Math.round((b.amount / maxTypeAmount) * 100))
                return (
                  <div
                    key={b.anomaly_type}
                    className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/30 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-on-surface">{b.label}</span>
                      <span className="font-mono font-bold text-primary">
                        {formatCompactDop(b.amount)}
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-surface-container-high overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-on-surface-variant">
                      <span>Total alertas: {b.count}</span>
                      <span>
                        Confirmadas: <strong className="text-red-600 dark:text-red-400">{b.confirmed}</strong> · Pendientes:{" "}
                        <strong className="text-amber-600 dark:text-amber-400">{b.pending}</strong>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: Ficha Formal de Emisión del Acta */}
        <div className="lg:col-span-5 bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-6 space-y-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/25">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-on-surface">
                  Datos de Emisión del Acta
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Certificación interna de veeduría preventiva
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-outline-variant/20">
                <span className="text-on-surface-variant">Organización</span>
                <span className="font-semibold text-on-surface text-right">
                  {data?.organization_name || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-outline-variant/20">
                <span className="text-on-surface-variant">Cobertura Auditada</span>
                <span className="font-semibold text-on-surface text-right">
                  {data?.scope_label || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-outline-variant/20">
                <span className="text-on-surface-variant">Emitido por</span>
                <span className="font-semibold text-on-surface text-right">
                  {data?.prepared_by || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-on-surface-variant">Fecha y Hora de Corte</span>
                <span className="font-mono font-semibold text-primary">
                  {data?.generated_at || "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface-variant leading-relaxed">
            Este documento consolida los indicadores de control preventivo registrados hasta la fecha de corte y puede adjuntarse como respaldo en informes de auditoría interna.
          </div>
        </div>
      </div>

      {/* Matriz Condicional de Tipificación Legal (Ley 340-06 y Reglamento 416-23) */}
      {breakdown.some((b) => b.count > 0) && (
        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold text-on-surface">
                Sustento Normativo Aplicable a los Hallazgos del Período (Ley 340-06 · Decreto 416-23)
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Artículos e hipótesis de auditoría activados dinámicamente según las tipologías con incidencia en este informe
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-mono font-semibold shrink-0">
              {breakdown.filter((b) => b.count > 0).length} tipología(s) con incidencia
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {breakdown.some((b) => b.anomaly_type === "PRICE_ANOMALY" && b.count > 0) && (
              <div className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/30 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <p className="font-bold text-on-surface">Sobreprecio y Razonabilidad (PRICE_ANOMALY)</p>
                  <p className="text-on-surface-variant leading-relaxed">
                    <strong>Art. 3 (Eficiencia y Economía — Ley 340-06)</strong> y <strong>Arts. 96–97 del Reg. 416-23</strong> sobre estudio previo de precios de mercado en el SECP.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  <strong>⚠️ Observación CBS/UNSPSC (Art. 3 num. 3):</strong> Cuando un contrato agrupa artículos heterogéneos bajo el mismo código UNSPSC genérico, se tipifica como <strong>falta administrativa de catalogación</strong> ante la DGCP.
                </div>
              </div>
            )}
            {breakdown.some((b) => b.anomaly_type === "FRAGMENTATION" && b.count > 0) && (
              <div className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/30 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <p className="font-bold text-on-surface">Fraccionamiento de Compras (FRAGMENTATION)</p>
                  <p className="text-on-surface-variant leading-relaxed">
                    <strong>Arts. 16 y 17 Párrafo I de la Ley 340-06</strong> y <strong>Art. 62 del Reg. 416-23</strong> (presunción de subdivisión para eludir umbrales del PACC), sancionable según <strong>Arts. 65 y 66</strong>.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  <strong>⚠️ Observación de Modalidad (Arts. 38–45 Reg. 416-23):</strong> En procesos de excepción (`PEEN`/`PEEX`/`PEUR`), verifique que exista resolución motivada y certificación presupuestaria que justifique contrataciones sucesivas.
                </div>
              </div>
            )}
            {breakdown.some((b) => b.anomaly_type === "COLLUSION" && b.count > 0) && (
              <div className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/30 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <p className="font-bold text-on-surface">Colusión y Competencia (COLLUSION)</p>
                  <p className="text-on-surface-variant leading-relaxed">
                    <strong>Art. 3 nums. 2 y 6</strong>, <strong>Arts. 11 y 14</strong> y <strong>Art. 66 Párrafo II de la Ley 340-06</strong> (inhabilitación del RPE de 1 a 5 años), junto al <strong>Art. 5 de la Ley 42-08</strong>.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  <strong>⚠️ Observación Beneficiario Final (Ley 155-17):</strong> Cruce las coincidencias de teléfono, domicilio o dominio con la <strong>Declaración Jurada de Beneficiario Final</strong> en el RPE para acreditar control societario común.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Central Table Section */}
      <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/25 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-bold text-on-surface">
              Anexo de Principales Hallazgos por Severidad
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Expedientes prioritarios incluidos en la exportación oficial del informe
            </p>
          </div>
          <span className="px-3 py-1 rounded-lg bg-surface-container-high text-xs font-mono font-semibold text-on-surface shrink-0">
            Top {topFindings.length} casos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/25 bg-surface-container-low/60 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="py-3 px-5">Código de Proceso</th>
                <th className="py-3 px-5">Organismo</th>
                <th className="py-3 px-5">Proveedor Adjudicatario</th>
                <th className="py-3 px-5">Tipología</th>
                <th className="py-3 px-5 text-center">Severidad</th>
                <th className="py-3 px-5">Estado</th>
                <th className="py-3 px-5 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-xs">
              {topFindings.map((f) => (
                <tr key={f.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-3.5 px-5 font-mono font-bold text-primary">
                    {f.process_code}
                  </td>
                  <td className="py-3.5 px-5 text-on-surface-variant">
                    {f.institution_name}
                  </td>
                  <td className="py-3.5 px-5 font-semibold text-on-surface">
                    {f.supplier_name}
                  </td>
                  <td className="py-3.5 px-5 text-on-surface-variant">
                    {f.anomaly_type_label}
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <span className="px-2.5 py-0.5 rounded-lg font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                      {Math.round(f.severity * 100)}%
                    </span>
                  </td>
                  <td className="py-3.5 px-5 font-medium text-on-surface">{f.status_label}</td>
                  <td className="py-3.5 px-5 text-right font-mono font-bold text-on-surface">
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
