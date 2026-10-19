import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { GitMerge } from "lucide-react"
import type { SankeyFlowLink, SankeyInstitutionNode, SankeySupplierNode } from "../../../domain/publicPortal"

interface BudgetSankeyCardProps {
  institutions: SankeyInstitutionNode[]
  suppliers: SankeySupplierNode[]
  links: SankeyFlowLink[]
  totalFlowAmount: number
}

function formatCompactDop(amount: number): string {
  if (amount >= 1_000_000_000) return `RD$ ${(amount / 1_000_000_000).toFixed(2)}B`
  if (amount >= 1_000_000) return `RD$ ${(amount / 1_000_000).toFixed(1)}M`
  return `RD$ ${amount.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`
}

export default function BudgetSankeyCard({
  institutions,
  suppliers,
  links,
  totalFlowAmount,
}: BudgetSankeyCardProps) {
  const navigate = useNavigate()
  const [hoveredLink, setHoveredLink] = useState<SankeyFlowLink | null>(null)

  const leftNodes = institutions.slice(0, 5)
  const rightNodes = suppliers.slice(0, 8)
  const svgHeight = 360
  const leftStep = svgHeight / Math.max(leftNodes.length, 1)
  const rightStep = svgHeight / Math.max(rightNodes.length, 1)

  const leftCoords = new Map<string, { y: number; inst: SankeyInstitutionNode }>()
  leftNodes.forEach((inst, idx) => {
    leftCoords.set(inst.id, { y: idx * leftStep + leftStep / 2, inst })
  })

  const rightCoords = new Map<string, { y: number; sup: SankeySupplierNode }>()
  rightNodes.forEach((sup, idx) => {
    rightCoords.set(sup.id, { y: idx * rightStep + rightStep / 2, sup })
  })

  return (
    <div className="glass rounded-3xl p-6 md:p-8 border border-outline-variant/25 relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary mb-1">
            <GitMerge className="w-4 h-4" />
            <span>Flujo de Fondos Públicos (OCDS)</span>
          </div>
          <h2 className="text-xl md:text-2xl font-display font-bold text-on-surface">
            Distribución del Presupuesto Nacional de Compras
          </h2>
          <p className="text-sm text-on-surface-variant">
            Flujo de fondos públicos desde las principales instituciones hacia proveedores privados adjudicados.
          </p>
        </div>
        <div className="text-left md:text-right shrink-0">
          <span className="text-[11px] uppercase tracking-wider text-outline block">Flujo Top Concentrado</span>
          <span className="text-2xl font-mono font-bold text-primary">{formatCompactDop(totalFlowAmount)}</span>
        </div>
      </div>

      {hoveredLink && (
        <div className="mb-4 px-4 py-2.5 rounded-2xl bg-primary/10 border border-primary/25 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-on-surface">
            {hoveredLink.source_name} → <span className="text-primary">{hoveredLink.target_name}</span>
          </span>
          <span className="font-mono font-bold text-primary">
            {formatCompactDop(hoveredLink.amount)} ({hoveredLink.percentage}% del flujo)
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <div className="lg:col-span-4 space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-outline mb-2">
            Top 5 Instituciones Compradoras
          </p>
          {leftNodes.map((inst) => (
            <button
              key={inst.id}
              type="button"
              onClick={() => navigate(`/public/institution/${inst.institution_id}`)}
              className="w-full text-left p-3 rounded-2xl bg-surface-container-low hover:bg-primary/10 border border-outline-variant/20 transition-all flex items-center justify-between gap-2 cursor-pointer"
            >
              <span className="text-xs font-semibold text-on-surface truncate" title={inst.name}>
                {inst.name}
              </span>
              <span className="text-xs font-mono font-bold text-primary shrink-0">
                {formatCompactDop(inst.total_amount)}
              </span>
            </button>
          ))}
        </div>

        <div className="lg:col-span-4 hidden lg:block">
          <svg viewBox={`0 0 320 ${svgHeight}`} className="w-full h-[320px] overflow-visible">
            <defs>
              <linearGradient id="sankeyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#003d9b" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.35" />
              </linearGradient>
            </defs>
            {links.map((lnk, idx) => {
              const src = leftCoords.get(lnk.source)
              const tgt = rightCoords.get(lnk.target)
              if (!src || !tgt) return null
              const strokeW = Math.max(3, Math.min(22, (lnk.percentage / 100) * 90))
              const d = `M 10 ${src.y} C 150 ${src.y}, 170 ${tgt.y}, 310 ${tgt.y}`
              return (
                <path
                  key={`${lnk.source}-${lnk.target}-${idx}`}
                  d={d}
                  fill="none"
                  stroke="url(#sankeyGrad)"
                  strokeWidth={strokeW}
                  className="transition-opacity duration-200 hover:opacity-100 opacity-75 cursor-pointer"
                  onMouseEnter={() => setHoveredLink(lnk)}
                  onMouseLeave={() => setHoveredLink(null)}
                />
              )
            })}
            {Array.from(leftCoords.values()).map(({ y, inst }) => (
              <circle key={inst.id} cx={10} cy={y} r={5} className="fill-primary" />
            ))}
            {Array.from(rightCoords.values()).map(({ y, sup }) => (
              <circle key={sup.id} cx={310} cy={y} r={5} className="fill-sky-500" />
            ))}
          </svg>
        </div>

        <div className="lg:col-span-4 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-outline mb-2">
            Principales Proveedores Adjudicados
          </p>
          {rightNodes.slice(0, 5).map((sup) => (
            <button
              key={sup.id}
              type="button"
              onClick={() => navigate(`/public/supplier/${encodeURIComponent(sup.name)}`)}
              className="w-full text-left p-3 rounded-2xl bg-surface-container-low hover:bg-primary/10 border border-outline-variant/20 transition-all flex items-center justify-between gap-2 cursor-pointer"
            >
              <span className="text-xs font-semibold text-on-surface truncate" title={sup.name}>
                {sup.name}
              </span>
              <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 shrink-0">
                {formatCompactDop(sup.total_amount)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}