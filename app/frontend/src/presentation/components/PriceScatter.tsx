import { useEffect, useRef } from "react"
import * as d3 from "d3"
import type { MarketPrice } from "../../domain/anomaly"

interface PriceScatterProps {
  data: MarketPrice[]
  median: number
  fullscreen?: boolean
  className?: string
}

export default function PriceScatter({ data, median, fullscreen, className = "" }: PriceScatterProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !tooltipRef.current || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const tooltip = d3.select(tooltipRef.current)
    tooltip.style("display", "none")

    const width = svgRef.current.clientWidth || 480
    const height = fullscreen ? (svgRef.current.clientHeight || 520) : 180
    const margin = { top: 20, right: 20, bottom: 28, left: 68 }
    const innerWidth = Math.max(100, width - margin.left - margin.right)
    const innerHeight = Math.max(80, height - margin.top - margin.bottom)

    const zoomG = svg.append("g")
    const g = zoomG.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    const maxPrice = d3.max(data, (d) => d.unit_price) ?? 1
    const paddedMax = maxPrice * 1.15

    const xScale = d3.scalePoint<number>()
      .domain(data.map((_, i) => i))
      .range([0, innerWidth])
      .padding(0.4)

    const yScale = d3.scaleLinear()
      .domain([0, paddedMax])
      .range([innerHeight, 0])

    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => `RD$${d3.format(",.0f")(d)}`)
      .tickSize(-innerWidth)

    g.append("g")
      .attr("class", "text-[9px] font-data text-outline")
      .call(yAxis)
      .call((sel) => sel.selectAll(".domain").remove())
      .call((sel) => sel.selectAll(".tick line").attr("stroke", "currentColor").attr("stroke-opacity", 0.08))

    const medianY = yScale(median)

    g.append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", medianY)
      .attr("y2", medianY)
      .attr("stroke", "var(--color-primary)")
      .attr("stroke-dasharray", "4,3")
      .attr("stroke-opacity", 0.5)
      .attr("stroke-width", 1.5)

    g.append("text")
      .attr("x", innerWidth)
      .attr("y", medianY - 6)
      .attr("text-anchor", "end")
      .attr("class", "text-[9px] font-bold fill-primary")
      .text(`Mediana: RD$ ${d3.format(",.0f")(median)}`)

    const baseR = fullscreen ? 6 : 4.5
    const anomR = fullscreen ? 9 : 7

    g.selectAll("circle.point")
      .data(data)
      .join("circle")
      .attr("class", "point")
      .attr("cx", (_, i) => xScale(i)!)
      .attr("cy", (d) => yScale(d.unit_price))
      .attr("r", (d) => (d.is_anomaly ? anomR : baseR))
      .attr("fill", (d) => (d.is_anomaly ? "var(--color-error)" : "var(--color-primary)"))
      .attr("fill-opacity", (d) => (d.is_anomaly ? 1 : 0.35))
      .attr("stroke", (d) => (d.is_anomaly ? "var(--color-error)" : "var(--color-primary)"))
      .attr("stroke-opacity", (d) => (d.is_anomaly ? 1 : 0.5))
      .attr("stroke-width", (d) => (d.is_anomaly ? 2 : 1))
      .attr("data-anomaly", (d) => (d.is_anomaly ? "true" : null))
      .attr("cursor", "pointer")
      .on("mouseover", function (event, d) {
        const p = d as MarketPrice
        const idx = data.indexOf(p)
        d3.select(this)
          .transition().duration(120)
          .attr("r", p.is_anomaly ? anomR + 4 : baseR + 3.5)
          .attr("fill-opacity", 1)
          .attr("stroke-opacity", 1)
          .attr("stroke-width", 3)

        g.selectAll("circle.point").filter(function () { return this !== event.currentTarget })
          .transition().duration(120)
          .attr("fill-opacity", 0.12)
          .attr("stroke-opacity", 0.12)

        const diffPct = median > 0 ? ((p.unit_price / median - 1) * 100) : 0
        const diffSign = diffPct >= 0 ? "+" : ""

        tooltip
          .style("display", "block")
          .html(`
            <div class="flex items-center justify-between gap-3 border-b border-outline-variant/25 pb-1.5 mb-1.5">
              <span class="font-bold text-on-surface truncate">${p.supplier_name || `Muestra #${idx + 1}`}</span>
              <span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">ID #${p.contract_id}</span>
            </div>
            ${p.description ? `<div class="text-[11px] text-on-surface-variant line-clamp-2 mb-1.5">${p.description}</div>` : ""}
            <div class="flex items-baseline justify-between gap-4">
              <span class="text-[10px] uppercase tracking-wider text-outline font-bold">Precio Unitario:</span>
              <span class="font-mono font-bold text-sm ${p.is_anomaly ? "text-error" : "text-primary"}">RD$ ${d3.format(",.2f")(p.unit_price)}</span>
            </div>
            <div class="flex items-baseline justify-between gap-4 mt-0.5">
              <span class="text-[10px] uppercase tracking-wider text-outline font-bold">Desviación vs Mediana:</span>
              <span class="font-mono font-semibold text-[11px] ${diffPct > 50 ? "text-error" : "text-on-surface"}">${diffSign}${diffPct.toFixed(0)}%</span>
            </div>
            ${p.is_anomaly ? '<div class="mt-2 pt-1.5 border-t border-error/20 text-[10px] font-bold text-error uppercase tracking-wider">⚠ Renglón Auditado (Sobreprecio Detectado)</div>' : ""}
          `)
      })
      .on("mousemove", (event) => {
        const x = Math.min(window.innerWidth - 290, event.clientX + 16)
        const y = Math.max(16, event.clientY - 24)
        tooltip
          .style("left", `${x}px`)
          .style("top", `${y}px`)
      })
      .on("mouseout", function () {
        d3.select(this)
          .transition().duration(120)
          .attr("r", (d: unknown) => ((d as MarketPrice).is_anomaly ? anomR : baseR))
          .attr("fill-opacity", (d: unknown) => ((d as MarketPrice).is_anomaly ? 1 : 0.35))
          .attr("stroke-opacity", (d: unknown) => ((d as MarketPrice).is_anomaly ? 1 : 0.5))
          .attr("stroke-width", (d: unknown) => ((d as MarketPrice).is_anomaly ? 2 : 1))

        g.selectAll("circle.point")
          .transition().duration(120)
          .attr("fill-opacity", (d: unknown) => ((d as MarketPrice).is_anomaly ? 1 : 0.35))
          .attr("stroke-opacity", (d: unknown) => ((d as MarketPrice).is_anomaly ? 1 : 0.5))

        tooltip.style("display", "none")
      })

    g.selectAll("text.anomaly-label")
      .data(data.filter((d) => d.is_anomaly).slice(0, 1))
      .join("text")
      .attr("class", "text-[9px] fill-error font-bold anomaly-label pointer-events-none")
      .attr("text-anchor", (d) => ((xScale(data.indexOf(d)) || 0) > innerWidth * 0.65 ? "end" : "start"))
      .attr("x", (d) => {
        const cx = xScale(data.indexOf(d)) || 0
        return cx > innerWidth * 0.65 ? cx - 12 : cx + 12
      })
      .attr("y", (d) => yScale(d.unit_price) + 3)
      .text((d) => d.supplier_name ? (d.supplier_name.length > 22 ? d.supplier_name.slice(0, 20) + "…" : d.supplier_name) : "")

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on("zoom", (event) => zoomG.attr("transform", event.transform))

    svg.call(zoom)
    svg.on("dblclick.zoom", null)
    svg.on("dblclick", () => {
      svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity)
    })
  }, [data, median, fullscreen])

  if (data.length === 0) return null

  return (
    <div className={`relative bg-background rounded-2xl p-4 border border-outline-variant/20 ${fullscreen ? "h-full" : ""} ${className}`}>
      <svg ref={svgRef} className={`w-full ${fullscreen ? "h-full" : ""}`} style={fullscreen ? undefined : { height: 180 }} />
      <div
        ref={tooltipRef}
        style={{ display: "none", zIndex: 9999 }}
        className="fixed pointer-events-none bg-surface-container-lowest dark:bg-surface-container-high text-on-surface text-xs rounded-xl shadow-2xl border border-outline-variant/40 px-3.5 py-2.5 w-68 leading-relaxed"
      />
    </div>
  )
}
