import { useEffect, useRef } from "react"
import * as d3 from "d3"
import { useElementWidth } from "../hooks/useElementWidth"
import type { CollusionLink } from "../../domain/anomaly"

interface NodeDatum {
  id: string
  degree?: number
  rnc?: string
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
  shared_address: "var(--color-secondary)",
  shared_rnc_prefix: "var(--color-outline-variant)",
}

const REASON_LABELS: Record<string, string> = {
  shared_phone: "Teléfono compartido",
  shared_domain: "Dominio email compartido",
  similar_name: "Nombre similar",
  shared_address: "Dirección compartida",
  shared_rnc_prefix: "Prefijo RNC compartido",
}

export default function CollusionNetwork({ links, fullscreen, className = "" }: CollusionNetworkProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const width = useElementWidth(svgRef)

  useEffect(() => {
    if (!svgRef.current || links.length === 0 || width <= 0) return

    const d3Links = links.map((l) => ({ ...l }))

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const tooltip = d3.select("body").append("div")
      .attr("class", "fixed pointer-events-none bg-surface-container-lowest dark:bg-surface-container-high text-on-surface text-xs rounded-xl shadow-2xl border border-outline-variant/40 px-3.5 py-2.5 max-w-80 leading-relaxed").style("z-index", "9999")
      .style("display", "none")

    const height = fullscreen ? (svgRef.current.clientHeight || 480) : 300
    const margin = 40
    const innerWidth = width - margin * 2
    const innerHeight = height - margin * 2

    const zoomG = svg.append("g")
    const g = zoomG.append("g").attr("transform", `translate(${margin},${margin})`)

    const degreeMap = new Map<string, number>()
    const rncMap = new Map<string, string>()
    for (const l of links) {
      degreeMap.set(l.source, (degreeMap.get(l.source) || 0) + 1)
      degreeMap.set(l.target, (degreeMap.get(l.target) || 0) + 1)
      if (l.source_rnc) rncMap.set(l.source, l.source_rnc)
      if (l.target_rnc) rncMap.set(l.target, l.target_rnc)
    }

    const nodeNames = Array.from(new Set(links.flatMap((l) => [l.source, l.target])))
    const nodes: NodeDatum[] = nodeNames.map((name) => ({
      id: name,
      degree: degreeMap.get(name) || 0,
      rnc: rncMap.get(name),
    }))

    const nodeConnectedTo = new Map<string, Set<string>>()
    for (const l of links) {
      if (!nodeConnectedTo.has(l.source)) nodeConnectedTo.set(l.source, new Set())
      if (!nodeConnectedTo.has(l.target)) nodeConnectedTo.set(l.target, new Set())
      nodeConnectedTo.get(l.source)!.add(l.target)
      nodeConnectedTo.get(l.target)!.add(l.source)
    }

    const simulation = d3
      .forceSimulation<NodeDatum>(nodes)
      .force(
        "link",
        d3
          .forceLink<NodeDatum, CollusionLink>(d3Links)
          .id((d) => d.id)
          .distance(120),
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(innerWidth / 2, innerHeight / 2))
      .force("collision", d3.forceCollide(30))

    const linkGroup = g.append("g")
    const nodeGroup = g.append("g")
    const labelGroup = g.append("g")

    const maxWeight = d3.max(links, (l) => l.weight) || 1

    const link = linkGroup
      .selectAll("line")
      .data(d3Links)
      .join("line")
      .attr("stroke", (d: CollusionLink) => REASON_COLORS[d.reason] || "var(--color-outline-variant)")
      .attr("stroke-width", (d: CollusionLink) => Math.max(1, d.weight * 3))
      .attr("stroke-opacity", (d: CollusionLink) => 0.3 + (d.weight / maxWeight) * 0.5)
      .attr("cursor", "pointer")

    function signalDetailsHtml(d: CollusionLink): string {
      const details = (d as unknown as { signal_details?: Record<string, unknown> }).signal_details
      if (!details || Object.keys(details).length === 0) return ""
      const labels: Record<string, string> = {
        shared_phone: "📞 Teléfono",
        shared_address: "📍 Dirección",
        shared_domain: "📧 Dominio",
        shared_rnc_prefix: "🔗 Prefijo RNC",
        similar_name: "📛 Nombre similar",
      }
      return Object.entries(details)
        .map(([k, v]) => {
          const label = labels[k]
          if (!label) return ""
          const display = Array.isArray(v) ? v.join(" / ") : String(v)
          return `<div class="text-outline mt-0.5">${label}: <span class="font-mono text-on-surface">${display}</span></div>`
        })
        .join("")
    }

    link
      .on("mouseover", function (_event, d) {
        d3.select(this).attr("stroke-opacity", 1).attr("stroke-width", Math.max(2, d.weight * 4))
        tooltip
          .style("display", "block")
          .html(`
            <div class="font-semibold text-on-surface">${(d.source as unknown as { id?: string }).id || String(d.source)} ⟷ ${(d.target as unknown as { id?: string }).id || String(d.target)}</div>
            <div class="text-outline mt-0.5">${REASON_LABELS[d.reason] || d.reason.replace(/_/g, " ")}</div>
            <div class="text-outline/60 mt-0.5">Peso: ${(d.weight * 100).toFixed(0)}%</div>
            ${signalDetailsHtml(d)}
          `)
      })
      .on("mousemove", (event) => {
        tooltip.style("left", `${Math.min(window.innerWidth - 300, event.clientX + 16)}px`).style("top", `${Math.max(16, event.clientY - 24)}px`)
      })
      .on("mouseout", function (_, d) {
        d3.select(this).attr("stroke-opacity", 0.3 + (d.weight / maxWeight) * 0.5).attr("stroke-width", Math.max(1, d.weight * 3))
        tooltip.style("display", "none")
      })

    const node = nodeGroup
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d: NodeDatum) => 5 + (d.degree || 0) * 3)
      .attr("fill", "var(--color-primary)")
      .attr("fill-opacity", 0.6)
      .attr("stroke", "var(--color-primary)")
      .attr("stroke-width", 2)
      .attr("cursor", "grab")
      .attr("data-pinned", false) as d3.Selection<SVGCircleElement, NodeDatum, SVGGElement, unknown>

    function nodeRadius(d: NodeDatum) {
      return 5 + (d.degree || 0) * 3
    }

    function getConnected(nodeId: string): Set<string> {
      return nodeConnectedTo.get(nodeId) || new Set()
    }

    function highlightNode(activeId: string) {
      const connected = getConnected(activeId)
      connected.add(activeId)

      link.attr("stroke-opacity", (d: unknown) => {
        const l = d as CollusionLink
        return l.source === activeId || (l.source as unknown as { id?: string })?.id === activeId ||
               l.target === activeId || (l.target as unknown as { id?: string })?.id === activeId ? 0.8 : 0.05
      })

      node.attr("fill-opacity", (d: NodeDatum) => connected.has(d.id) ? 0.9 : 0.08)
        .attr("stroke-opacity", (d: NodeDatum) => connected.has(d.id) ? 1 : 0.08)

      labelGroup.selectAll("text")
        .attr("fill-opacity", (d: unknown) => connected.has((d as NodeDatum).id) ? 1 : 0.08)
    }

    function restoreAll() {
      link.attr("stroke-opacity", (d: unknown) => {
        const l = d as CollusionLink
        return 0.3 + (l.weight / maxWeight) * 0.5
      })
      node.attr("fill-opacity", 0.6).attr("stroke-opacity", 1)
      labelGroup.selectAll("text").attr("fill-opacity", 1)
    }

    node.call(
      d3
        .drag<SVGCircleElement, NodeDatum>()
        .on("start", (event, d) => {
          event.sourceEvent.stopPropagation()
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
          const el = event.sourceEvent.currentTarget as SVGCircleElement
          if (d3.select(el).attr("data-pinned") !== "true") {
            d.fx = null
            d.fy = null
          }
        }),
    )

    node
      .on("mouseover", function (_event, d) {
        highlightNode(d.id)
        d3.select(this).attr("r", nodeRadius(d) + 3)

        const neighborIds = getConnected(d.id)
        const neighborNames = Array.from(neighborIds).slice(0, 5)
        const extra = neighborIds.size > 5 ? `…y ${neighborIds.size - 5} más` : ""

        tooltip
          .style("display", "block")
          .html(`
            <div class="font-semibold text-on-surface">${d.id}${d.rnc ? ` <span class="text-outline/60 font-normal">(${d.rnc})</span>` : ""}</div>
            <div class="text-outline mt-0.5">${d.degree || 0} conexión(es)</div>
            <div class="text-outline mt-1 font-medium">Conexiones:</div>
            ${neighborNames.map(n => `<div class="text-outline/70 ml-2">⟷ ${n}</div>`).join("")}
            ${extra ? `<div class="text-outline/50 ml-2">${extra}</div>` : ""}
          `)
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${Math.min(window.innerWidth - 300, event.clientX + 16)}px`)
          .style("top", `${Math.max(16, event.clientY - 24)}px`)
      })
      .on("mouseout", function () {
        restoreAll()
        d3.select(this).attr("r", nodeRadius(d3.select(this).datum() as NodeDatum))
        tooltip.style("display", "none")
      })
      .on("click", function (_event, d) {
        const pinned = d3.select(this).attr("data-pinned") === "true"
        if (pinned) {
          d3.select(this).attr("data-pinned", "false").attr("r", nodeRadius(d))
          d.fx = null
          d.fy = null
          simulation.alpha(0.3).restart()
        } else {
          d3.select(this).attr("data-pinned", "true").attr("r", nodeRadius(d) + 2)
            .attr("stroke", "var(--color-warning)")
            .attr("stroke-width", 3)
          d.fx = d.x
          d.fy = d.y
        }
      })

    node
      .append("title")
      .text((d: NodeDatum) => d.id)

    const label = labelGroup
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d: NodeDatum) => nodeRadius(d) + 12)
      .attr("class", "text-[9px] fill-on-surface font-semibold pointer-events-none")
      .text((d: NodeDatum) => d.id.length > 20 ? d.id.slice(0, 18) + "…" : d.id)

    simulation.on("tick", () => {
      link
        .attr("x1", (d: unknown) => (d as { source: { x: number } }).source.x)
        .attr("y1", (d: unknown) => (d as { source: { y: number } }).source.y)
        .attr("x2", (d: unknown) => (d as { target: { x: number } }).target.x)
        .attr("y2", (d: unknown) => (d as { target: { y: number } }).target.y)

      node.attr("cx", (d: NodeDatum) => d.x!).attr("cy", (d: NodeDatum) => d.y!)
      label.attr("x", (d: NodeDatum) => d.x!).attr("y", (d: NodeDatum) => d.y!)
    })

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 8])
      .on("zoom", (event) => zoomG.attr("transform", event.transform))

    svg.call(zoom)
    svg.on("dblclick.zoom", null)
    svg.on("dblclick", () => {
      svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity)
    })

    return () => {
      simulation.stop()
      tooltip.remove()
    }
  }, [links, fullscreen, width])

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
