import { useState } from "react"
import { useNavigate } from "react-router-dom"
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
  const rightNodes = suppliers.slice(0, 5)
  const svgHeight = 320
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
    <div className="bg-surface rounded-lg p-6 border border-outline-variant/30 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-[20px] font-display font-bold text-on-surface">
            Distribución del Presupuesto Nacional de Compras
          </h2>
          <p className="text-[14px] text-on-surface-variant">
            Flujo de fondos públicos desde las principales instituciones hacia proveedores privados.
          </p>
        </div>
        <div className="text-left md:text-right shrink-0">
          <span className="text-[11px] uppercase tracking-wider text-outline block">Volumen Concentrado</span>
          <span className="text-xl font-mono font-bold text-primary">{formatCompactDop(totalFlowAmount)}</span>
        </div>
      </div>

      <div className="mb-4 h-10 px-4 rounded-md bg-surface-container-low border border-outline-variant/25 flex items-center justify-between gap-2 text-xs">
        {hoveredLink ? (
          <>
            <span className="font-semibold text-on-surface truncate">
              {hoveredLink.source_name} → <span className="text-primary">{hoveredLink.target_name}</span>
            </span>
            <span className="font-mono font-bold text-primary shrink-0">
              {formatCompactDop(hoveredLink.amount)} ({hoveredLink.percentage}%)
            </span>
          </>
        ) : (
          <span className="text-outline">
            Pasa el cursor sobre una línea de flujo para inspeccionar el monto adjudicado y porcentaje entre institución y proveedor.
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <div className="lg:col-span-4 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-outline mb-2">
            Instituciones Públicas (Top 5)
          </p>
          {leftNodes.map((inst) => {
            const isHighlighted = hoveredLink?.source === inst.id
            return (
              <button
                key={inst.id}
                type="button"
                onClick={() => navigate(`/public/institution/${inst.institution_id}`)}
                className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                  isHighlighted
                    ? "bg-primary/10 border-primary"
                    : "bg-surface-container-low hover:bg-primary/5 border-outline-variant/20"
                }`}
              >
                <span className="text-xs font-medium text-on-surface truncate" title={inst.name}>
                  {inst.name}
                </span>
                <span className="text-xs font-mono font-bold text-primary shrink-0">
                  {formatCompactDop(inst.total_amount)}
                </span>
              </button>
            )
          })}
        </div>

        <div className="lg:col-span-4 hidden lg:block">
          <svg viewBox={`0 0 320 ${svgHeight}`} className="w-full h-[320px] overflow-visible">
            <defs>
              <linearGradient id="sankeyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#003d9b" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#0052cc" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="sankeyGradActive" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#003d9b" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#0052cc" stopOpacity="0.85" />
              </linearGradient>
            </defs>
            {links.map((lnk, idx) => {
              const src = leftCoords.get(lnk.source)
              const tgt = rightCoords.get(lnk.target)
              if (!src || !tgt) return null
              const isCurrent =
                hoveredLink?.source === lnk.source && hoveredLink?.target === lnk.target
              const strokeW = Math.max(6, Math.min(22, (lnk.percentage / 100) * 90))
              const d = `M 10 ${src.y} C 150 ${src.y}, 170 ${tgt.y}, 310 ${tgt.y}`
              return (
                <g
                  key={`${lnk.source}-${lnk.target}-${idx}`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredLink(lnk)}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  <path d={d} fill="none" stroke="transparent" strokeWidth={Math.max(18, strokeW + 8)} />
                  <path
                    d={d}
                    fill="none"
                    stroke={isCurrent ? "url(#sankeyGradActive)" : "url(#sankeyGrad)"}
                    strokeWidth={strokeW}
                    className="pointer-events-none transition-opacity duration-150"
                    opacity={hoveredLink && !isCurrent ? 0.25 : 1}
                  />
                </g>
              )
            })}
            {Array.from(leftCoords.values()).map(({ y, inst }) => (
              <circle key={inst.id} cx={10} cy={y} r={4.5} className="fill-primary pointer-events-none" />
            ))}
            {Array.from(rightCoords.values()).map(({ y, sup }) => (
              <circle key={sup.id} cx={310} cy={y} r={4.5} className="fill-primary/70 pointer-events-none" />
            ))}
          </svg>
        </div>

        <div className="lg:col-span-4 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-outline mb-2">
            Proveedores Privados (Top 5)
          </p>
          {rightNodes.map((sup) => {
            const isHighlighted = hoveredLink?.target === sup.id
            return (
              <button
                key={sup.id}
                type="button"
                onClick={() => navigate(`/public/supplier/${encodeURIComponent(sup.name)}`)}
                className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                  isHighlighted
                    ? "bg-primary/10 border-primary"
                    : "bg-surface-container-low hover:bg-primary/5 border-outline-variant/20"
                }`}
              >
                <span className="text-xs font-medium text-on-surface truncate" title={sup.name}>
                  {sup.name}
                </span>
                <span className="text-xs font-mono font-bold text-on-surface shrink-0">
                  {formatCompactDop(sup.total_amount)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}