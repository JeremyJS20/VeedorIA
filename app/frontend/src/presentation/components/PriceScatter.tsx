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

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const tooltip = d3.select("body").append("div")
      .attr("class", "fixed pointer-events-none z-[200] bg-surface text-xs rounded-xl shadow-xl border border-outline-variant/20 px-3 py-2 max-w-64 leading-relaxed")
      .style("display", "none")

    const width = svgRef.current.clientWidth
    const height = fullscreen ? svgRef.current.clientHeight : 160
    const margin = { top: 16, right: 16, bottom: 24, left: 64 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

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
      .attr("cursor", "pointer")
      .on("mouseover", function (event, d) {
        const p = d as MarketPrice
        d3.select(this)
          .transition().duration(150)
          .attr("r", p.is_anomaly ? 11 : 7)
          .attr("fill-opacity", 1)
          .attr("stroke-width", 3)

        g.selectAll("circle").filter(function () { return this !== event.currentTarget })
          .transition().duration(150)
          .attr("fill-opacity", 0.08)
          .attr("stroke-opacity", 0.08)

        tooltip
          .style("display", "block")
          .html(`
            <div class="font-semibold text-on-surface">${p.supplier_name || "Proveedor"}</div>
            <div class="text-outline mt-0.5">RD$ ${d3.format(",.2f")(p.unit_price)}</div>
            ${p.is_anomaly ? '<div class="text-error font-bold mt-0.5">⚠ ANOMALÍA</div>' : ""}
            <div class="text-outline/60 mt-0.5">vs mediana: ${((p.unit_price / median - 1) * 100).toFixed(0)}%</div>
          `)
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.pageX + 12}px`)
          .style("top", `${event.pageY - 10}px`)
      })
      .on("mouseout", function () {
        d3.select(this)
          .transition().duration(150)
          .attr("r", (d: unknown) => ((d as MarketPrice).is_anomaly ? 7 : 4))
          .attr("fill-opacity", (d: unknown) => ((d as MarketPrice).is_anomaly ? 1 : 0.25))
          .attr("stroke-width", (d: unknown) => ((d as MarketPrice).is_anomaly ? 2 : 0))

        g.selectAll("circle")
          .transition().duration(150)
          .attr("fill-opacity", (d: unknown) => ((d as MarketPrice).is_anomaly ? 1 : 0.25))
          .attr("stroke-opacity", (d: unknown) => ((d as MarketPrice).is_anomaly ? 1 : 0))

        tooltip.style("display", "none")
      })
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

    g.selectAll("text.anomaly-label")
      .data(data.filter((d) => d.is_anomaly).slice(0, 1))
      .join("text")
      .attr("class", "text-[8px] fill-error font-bold anomaly-label pointer-events-none")
      .attr("text-anchor", (d) => ((xScale(data.indexOf(d)) || 0) > innerWidth * 0.65 ? "end" : "start"))
      .attr("x", (d) => {
        const cx = xScale(data.indexOf(d)) || 0
        return cx > innerWidth * 0.65 ? cx - 10 : cx + 10
      })
      .attr("y", (d) => yScale(d.unit_price) + 3)
      .text((d) => d.supplier_name ? (d.supplier_name.length > 20 ? d.supplier_name.slice(0, 18) + "…" : d.supplier_name) : "")

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
  }, [data, median, fullscreen])

  if (data.length === 0) return null

  return (
    <div className={`bg-background rounded-2xl p-4 border border-outline-variant/20 ${fullscreen ? "h-full" : ""} ${className}`}>
      <svg ref={svgRef} className={`w-full ${fullscreen ? "h-full" : ""}`} style={fullscreen ? undefined : { height: 160 }} />
    </div>
  )
}
