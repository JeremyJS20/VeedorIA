import { useEffect, useRef } from "react"
import * as d3 from "d3"
import type { TimelineEntry } from "../../domain/anomaly"

interface FragmentationBarChartProps {
  entries: TimelineEntry[]
  threshold: number
  fullscreen?: boolean
  className?: string
}

export default function FragmentationBarChart({ entries, threshold, fullscreen, className = "" }: FragmentationBarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || entries.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const tooltip = d3.select("body").append("div")
      .attr("class", "fixed pointer-events-none bg-surface-container-lowest dark:bg-surface-container-high text-on-surface text-xs rounded-xl shadow-2xl border border-outline-variant/40 px-3.5 py-2.5 max-w-72 leading-relaxed").style("z-index", "9999")
      .style("display", "none")

    const width = svgRef.current.clientWidth
    const height = fullscreen ? svgRef.current.clientHeight : 200
    const margin = { top: 16, right: 16, bottom: 48, left: 64 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const zoomG = svg.append("g")
    const g = zoomG.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    const maxAmount = d3.max(entries, (d) => d.amount) ?? 1
    const paddedMax = Math.max(maxAmount, threshold) * 1.2

    const xScale = d3.scaleBand()
      .domain(entries.map((_, i) => String(i)))
      .range([0, innerWidth])
      .padding(0.25)

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

    const thresholdY = yScale(threshold)

    g.append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", thresholdY)
      .attr("y2", thresholdY)
      .attr("stroke", "var(--color-error)")
      .attr("stroke-dasharray", "6,3")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1.5)

    g.append("text")
      .attr("x", innerWidth)
      .attr("y", thresholdY - 6)
      .attr("text-anchor", "end")
      .attr("class", "text-[9px] font-bold fill-error")
      .text(`Umbral DOP ${d3.format(",.0f")(threshold)}`)

    const barWidth = xScale.bandwidth()

    g.selectAll("rect")
      .data(entries)
      .join("rect")
      .attr("x", (_, i) => xScale(String(i))!)
      .attr("y", (d) => yScale(d.amount))
      .attr("width", barWidth)
      .attr("height", (d) => innerHeight - yScale(d.amount))
      .attr("fill", (d) => (d.is_alert ? "var(--color-error)" : "var(--color-primary)"))
      .attr("fill-opacity", (d) => (d.is_alert ? 1 : 0.3))
      .attr("stroke", (d) => d.is_alert ? "var(--color-error)" : "none")
      .attr("stroke-width", (d) => d.is_alert ? 2 : 0)
      .attr("stroke-dasharray", (d) => d.is_alert ? "5,3" : "none")
      .attr("rx", 4)
      .attr("cursor", "pointer")
      .on("mouseover", function (event, d) {
        const e = d as TimelineEntry
        d3.select(this)
          .transition().duration(150)
          .attr("fill-opacity", 1)
          .attr("filter", "brightness(1.3)")

        g.selectAll("rect").filter(function () { return this !== event.currentTarget })
          .transition().duration(150)
          .attr("fill-opacity", 0.08)

        tooltip
          .style("display", "block")
          .html(`
            <div class="flex items-center justify-between gap-2 border-b border-outline-variant/25 pb-1 mb-1">
              <span class="font-mono font-bold text-[11px] text-primary">${e.reference}</span>
              <span class="font-mono text-[10px] text-outline">${e.date}</span>
            </div>
            <div class="font-semibold text-on-surface line-clamp-2 mb-1">${e.title || "Contrato"}</div>
            <div class="font-mono font-bold text-sm ${e.is_alert ? "text-error" : "text-on-surface"}">RD$ ${d3.format(",.2f")(e.amount)}</div>
            ${e.is_alert ? '<div class="text-error text-[10px] font-bold mt-1 uppercase tracking-wider">⚠ Contrato vinculado a fraccionamiento</div>' : ""}
          `)
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${Math.min(window.innerWidth - 280, event.clientX + 16)}px`)
          .style("top", `${Math.max(16, event.clientY - 24)}px`)
      })
      .on("mouseout", function () {
        d3.select(this)
          .transition().duration(150)
          .attr("fill-opacity", (d: unknown) => ((d as TimelineEntry).is_alert ? 1 : 0.3))
          .attr("filter", "none")

        g.selectAll("rect")
          .transition().duration(150)
          .attr("fill-opacity", (d: unknown) => ((d as TimelineEntry).is_alert ? 1 : 0.3))

        tooltip.style("display", "none")
      })
      .each(function (d: unknown) {
        const e = d as TimelineEntry
        if (e.is_alert) {
          d3.select(this)
            .append("animate")
            .attr("attributeName", "fill-opacity")
            .attr("values", "1;0.6;1")
            .attr("dur", "1.5s")
            .attr("repeatCount", "indefinite")
        }
      })

    g.selectAll("text.amount")
      .data(entries)
      .join("text")
      .attr("class", "text-[9px] fill-on-surface font-semibold amount pointer-events-none")
      .attr("x", (_, i) => xScale(String(i))! + barWidth / 2)
      .attr("y", (d) => yScale(d.amount) - 6)
      .attr("text-anchor", "middle")
      .text((d) => `RD$${d3.format(".2s")(d.amount)}`)

    g.selectAll("text.label")
      .data(entries)
      .join("text")
      .attr("class", "text-[8px] fill-outline font-semibold label")
      .attr("x", (_, i) => xScale(String(i))! + barWidth / 2)
      .attr("y", innerHeight + 14)
      .attr("text-anchor", "end")
      .attr("transform", (_, i) => `rotate(-35, ${xScale(String(i))! + barWidth / 2}, ${innerHeight + 14})`)
      .text((d) => d.date)

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on("zoom", (event) => zoomG.attr("transform", event.transform))

    svg.call(zoom)
    svg.on("dblclick.zoom", null)
    svg.on("dblclick", () => {
      svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity)
    })

    return () => {
      tooltip.remove()
    }
  }, [entries, threshold, fullscreen])

  if (entries.length === 0) {
    return (
      <div className={`bg-background rounded-2xl p-6 border border-outline-variant/20 text-center ${className}`}>
        <p className="text-sm text-outline">Sin datos de contratos para mostrar</p>
      </div>
    )
  }

  return (
    <div className={`bg-background rounded-2xl p-4 border border-outline-variant/20 ${fullscreen ? "h-full" : ""} ${className}`}>
      <svg ref={svgRef} className={`w-full ${fullscreen ? "h-full" : ""}`} style={fullscreen ? undefined : { height: 200 }} />
    </div>
  )
}
