import { useEffect, useRef } from "react"
import * as d3 from "d3"
import type { TimelineEntry } from "../../domain/anomaly"

interface FragmentationBarChartProps {
  entries: TimelineEntry[]
  threshold: number
  className?: string
}

export default function FragmentationBarChart({ entries, threshold, className = "" }: FragmentationBarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || entries.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const width = svgRef.current.clientWidth
    const height = 200
    const margin = { top: 16, right: 16, bottom: 48, left: 64 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    svg.attr("viewBox", `0 0 ${width} ${height}`)

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

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
      .attr("rx", 4)
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
      .append("title")
      .text((d: unknown) => {
        const e = d as TimelineEntry
        return `${e.title}: RD$ ${d3.format(",.2f")(e.amount)}${e.is_alert ? " | ANOMALÍA" : ""}`
      })

    g.selectAll("text.label")
      .data(entries)
      .join("text")
      .attr("class", "text-[8px] fill-outline font-semibold label")
      .attr("x", (_, i) => xScale(String(i))! + barWidth / 2)
      .attr("y", innerHeight + 14)
      .attr("text-anchor", "end")
      .attr("transform", (_, i) => `rotate(-35, ${xScale(String(i))! + barWidth / 2}, ${innerHeight + 14})`)
      .text((d) => d.date)
  }, [entries, threshold])

  if (entries.length === 0) {
    return (
      <div className={`bg-background rounded-2xl p-6 border border-outline-variant/20 text-center ${className}`}>
        <p className="text-sm text-outline">Sin datos de contratos para mostrar</p>
      </div>
    )
  }

  return (
    <div className={`bg-background rounded-2xl p-4 border border-outline-variant/20 ${className}`}>
      <svg ref={svgRef} className="w-full" style={{ height: 200 }} />
    </div>
  )
}
