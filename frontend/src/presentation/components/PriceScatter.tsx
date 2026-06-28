import { useEffect, useRef } from "react"
import * as d3 from "d3"
import type { MarketPrice } from "../../domain/anomaly"

interface PriceScatterProps {
  data: MarketPrice[]
  median: number
  className?: string
}

export default function PriceScatter({ data, median, className = "" }: PriceScatterProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const width = svgRef.current.clientWidth
    const height = 160
    const margin = { top: 16, right: 16, bottom: 24, left: 64 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    svg.attr("viewBox", `0 0 ${width} ${height}`)

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

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

    g.selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (_, i) => xScale(i)!)
      .attr("cy", (d) => yScale(d.unit_price))
      .attr("r", (d) => (d.is_anomaly ? 7 : 4))
      .attr("fill", (d) => (d.is_anomaly ? "var(--color-error)" : "var(--color-primary)"))
      .attr("fill-opacity", (d) => (d.is_anomaly ? 1 : 0.25))
      .attr("stroke", (d) => (d.is_anomaly ? "var(--color-error)" : "none"))
      .attr("stroke-width", (d) => (d.is_anomaly ? 2 : 0))
      .attr("data-anomaly", (d) => (d.is_anomaly ? "true" : null))
      .each(function (d: unknown) {
        const p = d as MarketPrice
        if (p.is_anomaly) {
          d3.select(this)
            .append("animate")
            .attr("attributeName", "r")
            .attr("values", "7;9;7")
            .attr("dur", "1.5s")
            .attr("repeatCount", "indefinite")
        }
      })
      .append("title")
      .text((d: unknown) => {
        const p = d as MarketPrice
        return `${p.supplier_name || "Proveedor"}: RD$ ${d3.format(",.2f")(p.unit_price)}${p.is_anomaly ? " | ANOMALÍA" : ""}`
      })
  }, [data, median])

  if (data.length === 0) return null

  return (
    <div className={`bg-background rounded-2xl p-4 border border-outline-variant/20 ${className}`}>
      <svg ref={svgRef} className="w-full" style={{ height: 160 }} />
    </div>
  )
}
