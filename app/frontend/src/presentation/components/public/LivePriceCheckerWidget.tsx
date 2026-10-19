import { useState } from "react"
import { useNavigate } from "react-router-dom"
import type { PriceComparisonItem } from "../../../domain/publicPortal"

interface LivePriceCheckerWidgetProps {
  items: PriceComparisonItem[]
}

export default function LivePriceCheckerWidget({ items }: LivePriceCheckerWidgetProps) {
  const navigate = useNavigate()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const current = items[selectedIndex] || items[0]

  if (!current) return null

  return (
    <div className="bg-surface rounded-lg p-6 md:p-8 border border-outline-variant/30 shadow-sm flex flex-col justify-between">
      <div>
        <h2 className="text-[20px] font-display font-bold text-on-surface text-center mb-2">
          Comparador de Precios Unitarios en Tiempo Real
        </h2>
        <p className="text-xs text-on-surface-variant text-center mb-5">
          Selecciona un renglón adjudicado para comparar el precio estatal frente a la referencia del mercado:
        </p>

        <div className="flex flex-wrap justify-center gap-1.5 mb-6">
          {items.slice(0, 4).map((it, idx) => (
            <button
              key={it.anomaly_id}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer truncate max-w-[180px] ${
                idx === selectedIndex
                  ? "bg-primary text-on-primary font-semibold"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-primary/10"
              }`}
              title={it.item_description}
            >
              {it.item_description}
            </button>
          ))}
        </div>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="p-4 rounded bg-error/10 border border-error/30">
            <span className="text-xs font-semibold text-on-surface-variant block mb-1">
              Precio Adjudicado Estado
            </span>
            <p className="text-xl font-mono font-bold text-error mb-1">
              RD$ {current.adjudicated_unit_price.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / unidad
            </p>
            <p className="text-xs text-on-surface truncate" title={current.institution_name}>
              {current.institution_name}
            </p>
            <p className="text-[11px] font-mono text-outline truncate">
              Licitación {current.dgcp_code}
            </p>
          </div>

          <div className="p-4 rounded bg-primary/10 border border-primary/25">
            <span className="text-xs font-semibold text-on-surface-variant block mb-1">
              Precio Promedio Mercado
            </span>
            <p className="text-xl font-mono font-bold text-on-surface mb-1">
              RD$ {current.market_reference_price.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / unidad
            </p>
            <p className="text-xs text-on-surface-variant">
              Referencia UNSPSC #{current.unspsc_code}
            </p>
            <p className="text-[11px] text-outline">
              Variación detectada: +{current.overprice_pct.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-outline-variant/20 text-xs">
        <span className="text-on-surface-variant truncate">
          Proveedor: <strong className="text-on-surface">{current.supplier_name}</strong>
        </span>
        <button
          type="button"
          onClick={() => navigate(`/public/process/${current.contract_id}`)}
          className="text-primary font-semibold hover:underline shrink-0 cursor-pointer"
        >
          Ver contrato →
        </button>
      </div>
    </div>
  )
}