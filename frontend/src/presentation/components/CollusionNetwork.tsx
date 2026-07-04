import { useEffect, useRef } from "react"
import * as d3 from "d3"
import type { CollusionLink } from "../../domain/anomaly"

interface NodeDatum {
  id: string
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

interface CollusionNetworkProps {
  links: CollusionLink[]
  fullscreen?: boolean
  className?: string
}

const REASON_COLORS: Record<string, string> = {
  shared_phone: "var(--color-error)",
  shared_domain: "var(--color-warning)",
  similar_name: "var(--color-primary)",
}

const REASON_LABELS: Record<string, string> = {
  shared_phone: "Teléfono compartido",
  shared_domain: "Dominio email compartido",
  similar_name: "Nombre similar",
}

export default function CollusionNetwork({ links, fullscreen, className = "" }: CollusionNetworkProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || links.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const width = svgRef.current.clientWidth
    const height = fullscreen ? svgRef.current.clientHeight : 300
    const margin = 40
    const innerWidth = width - margin * 2
    const innerHeight = height - margin * 2

    svg.attr("viewBox", `0 0 ${width} ${height}`)

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin},${margin})`)

    const nodeNames = new Set<string>()
    for (const l of links) {
      nodeNames.add(l.source)
      nodeNames.add(l.target)
    }
    const nodes: NodeDatum[] = Array.from(nodeNames).map((name) => ({ id: name }))

    const simulation = d3
      .forceSimulation<NodeDatum>(nodes)
      .force(
        "link",
        d3
          .forceLink<NodeDatum, CollusionLink>(links)
          .id((d) => d.id)
          .distance(120),
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(innerWidth / 2, innerHeight / 2))
      .force("collision", d3.forceCollide(30))

    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d: CollusionLink) => REASON_COLORS[d.reason] || "var(--color-outline-variant)")
      .attr("stroke-width", (d: CollusionLink) => Math.max(1, d.weight * 3))
      .attr("stroke-opacity", 0.5)

    const node = g
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 10)
      .attr("fill", "var(--color-primary)")
      .attr("fill-opacity", 0.6)
      .attr("stroke", "var(--color-primary)")
      .attr("stroke-width", 2) as d3.Selection<SVGCircleElement, NodeDatum, SVGGElement, unknown>

    node.call(
      d3
        .drag<SVGCircleElement, NodeDatum>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on("drag", (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        }),
    )

    node
      .append("title")
      .text((d: NodeDatum) => d.id)

    const label = g
      .append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("dy", 22)
      .attr("class", "text-[9px] fill-on-surface font-semibold")
      .text((d: NodeDatum) => d.id.length > 20 ? d.id.slice(0, 18) + "…" : d.id)

    simulation.on("tick", () => {
      link
        .attr("x1", (d: unknown) => (d as any).source.x)
        .attr("y1", (d: unknown) => (d as any).source.y)
        .attr("x2", (d: unknown) => (d as any).target.x)
        .attr("y2", (d: unknown) => (d as any).target.y)

      node.attr("cx", (d: NodeDatum) => d.x!).attr("cy", (d: NodeDatum) => d.y!)
      label.attr("x", (d: NodeDatum) => d.x!).attr("y", (d: NodeDatum) => d.y!)
    })

    return () => {
      simulation.stop()
    }
  }, [links])

  if (links.length === 0) {
    return (
      <div className={`bg-background rounded-2xl p-6 border border-outline-variant/20 text-center ${className}`}>
        <p className="text-sm text-outline">Sin vínculos de colusión detectados</p>
      </div>
    )
  }

  const usedReasons = new Set(links.map((l) => l.reason))

  return (
    <div className={`bg-background rounded-2xl p-4 border border-outline-variant/20 ${fullscreen ? "h-full" : ""} ${className}`}>
      <svg ref={svgRef} className={`w-full ${fullscreen ? "h-full" : ""}`} style={fullscreen ? undefined : { height: 300 }} />
      <div className="flex flex-wrap gap-4 mt-3 justify-center">
        {Array.from(usedReasons).map((reason) => (
          <div key={reason} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-0.5 rounded-full"
              style={{ backgroundColor: REASON_COLORS[reason] || "var(--color-outline-variant)" }}
            />
            <span className="text-[10px] text-outline">{REASON_LABELS[reason] || reason}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
