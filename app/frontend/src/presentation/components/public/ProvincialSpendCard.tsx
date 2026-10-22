import { useState } from "react"
import type { ProvincialSpendItem } from "../../../domain/publicPortal"

interface ProvincialSpendCardProps {
  provinces: ProvincialSpendItem[]
  selectedProvince: string
  onSelectProvince: (province: string) => void
  coveragePct?: number
}

function formatCompactDop(amount: number): string {
  if (amount >= 1_000_000_000) return `RD$ ${(amount / 1_000_000_000).toFixed(2)}B`
  if (amount >= 1_000_000) return `RD$ ${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `RD$ ${(amount / 1_000).toFixed(0)}K`
  return `RD$ ${amount.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`
}

function formatShare(sharePct: number): string {
  if (sharePct <= 0) return "0%"
  if (sharePct < 0.01) return "<0.01%"
  return `${sharePct.toLocaleString("es-DO", { maximumFractionDigits: 2 })}%`
}

export default function ProvincialSpendCard({
  provinces,
  selectedProvince,
  onSelectProvince,
  coveragePct,
}: ProvincialSpendCardProps) {
  const [hovered, setHovered] = useState<ProvincialSpendItem | null>(null)
  const selectedItem = provinces.find((prov) => prov.id === selectedProvince)
  const activeItem = hovered ?? selectedItem ?? provinces[0]

  return (
    <div className="bg-surface rounded-lg p-6 border border-outline-variant/30 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-1">
          <h2 className="text-[20px] font-display font-bold text-on-surface">
            Distribución del Gasto por Provincia del Proveedor
          </h2>
          {selectedProvince && (
            <button
              type="button"
              onClick={() => onSelectProvince("")}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer shrink-0"
            >
              Ver todas
            </button>
          )}
        </div>
        <p className="text-[14px] text-on-surface-variant mb-2">
          Monto adjudicado a proveedores con domicilio declarado en cada provincia, de mayor a menor.
        </p>
        <p className="text-[11px] text-outline mb-4">
          Base: domicilio del proveedor
          {coveragePct !== undefined ? ` · ${coveragePct.toLocaleString("es-DO", { maximumFractionDigits: 1 })}% del monto nacional atribuido` : ""}
        </p>

        <div className="max-h-[340px] overflow-y-auto pr-1 space-y-0.5">
          {provinces.map((prov) => {
            const isSelected = selectedProvince === prov.id
            const isActive = activeItem?.id === prov.id
            return (
              <button
                key={prov.id}
                type="button"
                onMouseEnter={() => setHovered(prov)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelectProvince(isSelected ? "" : prov.id)}
                className={`w-full text-left px-2 py-1.5 rounded transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-primary/10"
                    : isActive
                      ? "bg-primary/5"
                      : "hover:bg-surface-container-low"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span
                    className={`truncate ${
                      isSelected ? "font-semibold text-on-surface" : "text-on-surface-variant"
                    }`}
                  >
                    {prov.province}
                  </span>
                  <span className="font-mono font-bold text-on-surface shrink-0">
                    {formatCompactDop(prov.total_amount)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-surface-container-low overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isSelected ? "bg-primary" : "bg-primary/50"}`}
                      style={{ width: `${Math.min(100, Math.max(1.5, prov.share_pct))}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-outline w-14 text-right shrink-0">
                    {formatShare(prov.share_pct)}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {activeItem && (
        <div className="mt-4 p-4 rounded-lg bg-surface-container-low border border-outline-variant/25 space-y-1.5 text-xs">
          <p className="font-bold text-sm text-on-surface">{activeItem.province}</p>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Total Adjudicado:</span>
            <span className="font-mono font-bold text-on-surface">
              {formatCompactDop(activeItem.total_amount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Procesos con adjudicación:</span>
            <span className="font-medium text-on-surface">
              {activeItem.active_processes.toLocaleString("es-DO")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Hallazgos de auditoría:</span>
            <span className="font-bold text-error">
              {activeItem.critical_alerts.toLocaleString("es-DO")}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
