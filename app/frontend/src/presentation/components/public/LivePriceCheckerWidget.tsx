import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AlertTriangle, ArrowUpRight, Scale } from "lucide-react"
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
    <div className="glass rounded-3xl p-6 md:p-8 border border-outline-variant/25 flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-error">
            <Scale className="w-4 h-4" />
            <span>Auditoría UNSPSC en Vivo</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-error/15 text-error text-xs font-mono font-bold inline-flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            SOBREPRECIO DETECTADO: +{current.overprice_pct.toFixed(0)}%
          </span>
        </div>

        <h2 className="text-xl md:text-2xl font-display font-bold text-on-surface mb-1">
          Comparador de Precios Unitarios en Tiempo Real
        </h2>
        <p className="text-sm text-on-surface-variant mb-4">
          Contraste directo entre el precio unitario adjudicado por el Estado y la mediana histórica de mercado UNSPSC.
        </p>

        <div className="flex flex-wrap gap-1.5 mb-5">
          {items.slice(0, 5).map((it, idx) => (
            <button
              key={it.anomaly_id}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer truncate max-w-[180px] ${
                idx === selectedIndex
                  ? "bg-primary text-on-primary font-bold shadow-sm"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-primary/10"
              }`}
              title={it.item_description}
            >
              {it.item_description}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="p-4 rounded-2xl bg-error/10 border border-error/30">
            <span className="text-[11px] font-bold uppercase tracking-wider text-error block mb-1">
              Precio Adjudicado Estado
            </span>
            <p className="text-2xl font-mono font-bold text-error mb-1">
              RD$ {current.adjudicated_unit_price.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-on-surface font-semibold truncate" title={current.institution_name}>
              {current.institution_name}
            </p>
            <p className="text-[11px] text-on-surface-variant truncate" title={current.supplier_name}>
              Proveedor: {current.supplier_name}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
              Precio Promedio Mercado
            </span>
            <p className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mb-1">
              RD$ {current.market_reference_price.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-on-surface font-semibold">
              Categoría UNSPSC #{current.unspsc_code}
            </p>
            <p className="text-[11px] text-on-surface-variant">
              Mediana calculada sobre 98,869 renglones DGCP
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-outline-variant/20">
        <div>
          <span className="text-xs font-semibold text-on-surface block truncate max-w-xs">
            Artículo: {current.item_description}
          </span>
          <span className="text-[11px] font-mono text-outline">
            Proceso: {current.dgcp_code} · Contrato: {current.contract_code}
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/public/process/${current.contract_id}`)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
        >
          <span>Auditar Expediente</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}