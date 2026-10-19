import { useState } from "react"
import { MapPin, ShieldAlert } from "lucide-react"
import type { ProvincialSpendItem } from "../../../domain/publicPortal"

interface ProvincialMapCardProps {
  provinces: ProvincialSpendItem[]
  selectedProvince: string
  onSelectProvince: (province: string) => void
}

const SVG_ZONES: Record<string, { cx: number; cy: number; r: number; path: string }> = {
  PP: { cx: 195, cy: 65, r: 22, path: "M150,50 L240,45 L250,85 L160,90 Z" },
  ST: { cx: 205, cy: 115, r: 28, path: "M155,90 L250,85 L255,145 L150,145 Z" },
  DU: { cx: 295, cy: 105, r: 24, path: "M250,75 L345,75 L345,135 L255,135 Z" },
  LV: { cx: 225, cy: 165, r: 24, path: "M175,145 L275,135 L275,190 L175,190 Z" },
  AZ: { cx: 125, cy: 195, r: 26, path: "M55,150 L175,150 L175,245 L65,245 Z" },
  SC: { cx: 235, cy: 225, r: 22, path: "M185,190 L265,190 L265,255 L185,255 Z" },
  SD: { cx: 295, cy: 215, r: 34, path: "M265,175 L340,175 L340,250 L265,250 Z" },
  SP: { cx: 365, cy: 210, r: 21, path: "M340,175 L395,175 L395,245 L340,245 Z" },
  LR: { cx: 415, cy: 210, r: 20, path: "M395,175 L440,175 L440,245 L395,245 Z" },
  LA: { cx: 465, cy: 195, r: 25, path: "M440,145 L505,155 L495,245 L440,245 Z" },
}

function formatCompactDop(amount: number): string {
  if (amount >= 1_000_000_000) return `RD$ ${(amount / 1_000_000_000).toFixed(2)}B`
  if (amount >= 1_000_000) return `RD$ ${(amount / 1_000_000).toFixed(1)}M`
  return `RD$ ${amount.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`
}

export default function ProvincialMapCard({
  provinces,
  selectedProvince,
  onSelectProvince,
}: ProvincialMapCardProps) {
  const [hovered, setHovered] = useState<ProvincialSpendItem | null>(provinces[0] || null)
  const activeItem = hovered || provinces[0]

  return (
    <div className="glass rounded-3xl p-6 md:p-8 border border-outline-variant/25 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            <MapPin className="w-4 h-4" />
            <span>Cartografía Territorial RD</span>
          </div>
          {selectedProvince && (
            <button
              type="button"
              onClick={() => onSelectProvince("")}
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              Limpiar filtro provincial ({selectedProvince})
            </button>
          )}
        </div>
        <h2 className="text-xl md:text-2xl font-display font-bold text-on-surface mb-1">
          Distribución del Gasto Público por Provincias
        </h2>
        <p className="text-sm text-on-surface-variant mb-4">
          Haz clic en una demarcación del mapa o de la lista para filtrar las contrataciones públicas de tu provincia.
        </p>

        <div className="relative bg-surface-container-low/70 rounded-2xl p-4 border border-outline-variant/20 mb-4">
          <svg viewBox="30 30 490 240" className="w-full h-[210px]">
            {provinces.map((prov) => {
              const zone = SVG_ZONES[prov.id]
              if (!zone) return null
              const isSelected = selectedProvince === prov.id || selectedProvince === prov.province
              const isHovered = activeItem?.id === prov.id
              const opacity = Math.min(0.95, Math.max(0.28, prov.share_pct / 35))
              return (
                <g
                  key={prov.id}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHovered(prov)}
                  onClick={() => onSelectProvince(isSelected ? "" : prov.id)}
                >
                  <path
                    d={zone.path}
                    fill={isSelected ? "#dc2626" : "#003d9b"}
                    fillOpacity={isSelected ? 0.85 : isHovered ? 0.78 : opacity}
                    stroke="#ffffff"
                    strokeWidth={isSelected || isHovered ? 2.5 : 1.2}
                    rx={8}
                  />
                  <circle
                    cx={zone.cx}
                    cy={zone.cy}
                    r={Math.max(8, Math.min(18, prov.share_pct * 0.65))}
                    className={isSelected ? "fill-red-500" : "fill-sky-400/80"}
                  />
                  <text
                    x={zone.cx}
                    y={zone.cy + 4}
                    textAnchor="middle"
                    className="fill-white text-[10px] font-bold pointer-events-none"
                  >
                    {prov.id}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {activeItem && (
        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/25 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-outline block">
              {activeItem.region} · {activeItem.province}
            </span>
            <span className="text-lg font-mono font-bold text-primary">
              {formatCompactDop(activeItem.total_amount)}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-outline block">Procesos Activos</span>
            <span className="text-lg font-mono font-bold text-on-surface">
              {activeItem.active_processes.toLocaleString("es-DO")}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-outline block">Alertas Críticas</span>
            <span className="text-lg font-mono font-bold text-error inline-flex items-center gap-1">
              <ShieldAlert className="w-4 h-4" />
              {activeItem.critical_alerts.toLocaleString("es-DO")}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}