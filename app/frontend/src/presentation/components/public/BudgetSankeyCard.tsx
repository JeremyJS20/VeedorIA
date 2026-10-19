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
  const selectedSuppliers: SankeySupplierNode[] = []
  const seenSupIds = new Set<string>()
  for (const inst of leftNodes) {
    const instLink = links.find((l) => l.source === inst.id)
    if (instLink) {
      const supObj = suppliers.find((s) => s.id === instLink.target)
      if (supObj && !seenSupIds.has(supObj.id)) {
        seenSupIds.add(supObj.id)
        selectedSuppliers.push(supObj)
      }
    }
  }
  for (const sup of suppliers) {
    if (selectedSuppliers.length >= 6) break
    if (!seenSupIds.has(sup.id)) {
      seenSupIds.add(sup.id)
      selectedSuppliers.push(sup)
    }
  }

  const rightNodes = selectedSuppliers.slice(0, 6).sort((a, b) => b.total_amount - a.total_amount)
  const svgHeight = 330
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
          <svg viewBox={`0 0 320 ${svgHeight}`} className="w-full h-[330px] overflow-visible">
            <defs>
              <linearGradient id="sankeyGrad" gradientUnits="userSpaceOnUse" x1="10" y1="0" x2="310" y2="0">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.45" />
              </linearGradient>
              <linearGradient id="sankeyGradActive" gradientUnits="userSpaceOnUse" x1="10" y1="0" x2="310" y2="0">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="1" />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.95" />
              </linearGradient>
            </defs>
            {links.map((lnk, idx) => {
              const src = leftCoords.get(lnk.source)
              const tgt = rightCoords.get(lnk.target)
              if (!src || !tgt) return null
              const isCurrent =
                hoveredLink?.source === lnk.source && hoveredLink?.target === lnk.target
              const strokeW = Math.max(5, Math.min(20, 5 + Math.log10(Math.max(1, lnk.percentage + 1)) * 7))
              const d = `M 10 ${src.y} C 150 ${src.y}, 170 ${tgt.y}, 310 ${tgt.y}`
              return (
                <g
                  key={`${lnk.source}-${lnk.target}-${idx}`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredLink(lnk)}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  <path d={d} fill="none" stroke="transparent" strokeWidth={Math.max(20, strokeW + 10)} />
                  <path
                    d={d}
                    fill="none"
                    stroke={isCurrent ? "url(#sankeyGradActive)" : "url(#sankeyGrad)"}
                    strokeWidth={strokeW}
                    strokeLinecap="round"
                    className="pointer-events-none transition-opacity duration-150"
                    opacity={hoveredLink && !isCurrent ? 0.2 : 0.9}
                  />
                </g>
              )
            })}
            {Array.from(leftCoords.values()).map(({ y, inst }) => (
              <circle key={inst.id} cx={10} cy={y} r={5} className="fill-primary pointer-events-none" />
            ))}
            {Array.from(rightCoords.values()).map(({ y, sup }) => (
              <circle key={sup.id} cx={310} cy={y} r={5} className="fill-primary pointer-events-none" />
            ))}
          </svg>
        </div>

        <div className="lg:col-span-4 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-outline mb-2">
            Proveedores Adjudicados Principales
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