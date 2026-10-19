import type { PublicTenderSummary } from "../../domain/publicPortal"

function escapeCsvCell(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportTendersToCsv(items: PublicTenderSummary[], filename = "veedoria-contrataciones.csv"): void {
  const headers = [
    "Contrato",
    "Proceso_DGCP",
    "Titulo_Objeto",
    "Institucion",
    "Proveedor",
    "RPE_RNC",
    "Monto_DOP",
    "Moneda",
    "Estado",
    "Fecha_Firma",
    "Alertas_IA",
    "Severidad_Max",
  ]
  const rows = items.map((it) => [
    escapeCsvCell(it.contract_code),
    escapeCsvCell(it.dgcp_code),
    escapeCsvCell(it.title),
    escapeCsvCell(it.institution_name),
    escapeCsvCell(it.supplier_name),
    escapeCsvCell(it.supplier_rpe),
    escapeCsvCell(it.amount_adjudicated),
    escapeCsvCell(it.currency),
    escapeCsvCell(it.status),
    escapeCsvCell(it.signed_date || ""),
    escapeCsvCell(it.anomaly_count),
    escapeCsvCell(it.max_severity),
  ])

  const csvBody = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n")
  const blob = new Blob(["\uFEFF" + csvBody], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportTendersToJson(items: PublicTenderSummary[], filename = "veedoria-contrataciones.json"): void {
  const payload = {
    standard: "OCDS / NORTIC A4:2024",
    source: "VeedorIA — Portal de Veeduría Ciudadana",
    exported_at: new Date().toISOString(),
    count: items.length,
    records: items,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}