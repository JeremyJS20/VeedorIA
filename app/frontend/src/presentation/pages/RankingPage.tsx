import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search } from "lucide-react"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import SectionContainer from "../components/SectionContainer"
import { usePublicRanking } from "../hooks/usePublicPortal"

export default function RankingPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"amount" | "anomalies" | "transparency">("amount")
  const { data: ranking, isLoading } = usePublicRanking(search, sortBy)

  const items = ranking?.items || []

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-4 md:px-8">
        <SectionContainer className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-on-surface">
              Ranking de Transparencia Institucional
            </h1>
            <p className="text-sm text-on-surface-variant max-w-3xl">
              Relación de instituciones del Estado Dominicano según volumen contratado e incidencia de hallazgos de auditoría.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface rounded-lg p-5 border border-outline-variant/30 shadow-sm">
              <span className="text-[11px] uppercase tracking-wider text-outline block">
                Instituciones Evaluadas
              </span>
              <span className="text-2xl font-mono font-bold text-on-surface">
                {ranking?.total_institutions ?? "..."}
              </span>
            </div>
            <div className="bg-surface rounded-lg p-5 border border-outline-variant/30 shadow-sm">
              <span className="text-[11px] uppercase tracking-wider text-outline block">
                Promedio Nacional de Cumplimiento
              </span>
              <span className="text-2xl font-mono font-bold text-primary">
                {ranking?.avg_transparency ?? "..."}%
              </span>
            </div>
            <div className="bg-surface rounded-lg p-5 border border-outline-variant/30 shadow-sm">
              <span className="text-[11px] uppercase tracking-wider text-outline block">
                Volumen Total Auditado
              </span>
              <span className="text-2xl font-mono font-bold text-on-surface">
                RD$ {((ranking?.total_audited_amount || 0) / 1_000_000_000).toFixed(2)}B
              </span>
            </div>
          </div>

          <section className="bg-surface rounded-lg p-6 md:p-8 border border-outline-variant/30 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-outline absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrar institución por nombre..."
                  className="w-full pl-10 pr-4 py-2 rounded bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-outline">Ordenar por:</span>
                {(
                  [
                    { key: "amount", label: "Mayor Volumen" },
                    { key: "anomalies", label: "Más Hallazgos" },
                    { key: "transparency", label: "Mayor Cumplimiento" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSortBy(opt.key)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                      sortBy === opt.key
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-primary/10"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-outline text-sm">Cargando instituciones...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/25 text-[11px] uppercase tracking-wider text-outline">
                      <th className="py-3 pr-3">#</th>
                      <th className="py-3 px-3">Institución</th>
                      <th className="py-3 px-3 text-right">Contratos</th>
                      <th className="py-3 px-3 text-right">Volumen Contratado</th>
                      <th className="py-3 px-3 text-right">Hallazgos</th>
                      <th className="py-3 px-3">Cumplimiento</th>
                      <th className="py-3 pl-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15">
                    {items.map((row, idx) => (
                      <tr key={row.institution_id} className="hover:bg-surface-container-low/60">
                        <td className="py-3.5 pr-3 font-mono text-xs text-outline">{idx + 1}</td>
                        <td className="py-3.5 px-3 font-medium text-on-surface">
                          <button
                            type="button"
                            onClick={() => navigate(`/public/institution/${row.institution_id}`)}
                            className="text-left hover:text-primary hover:underline cursor-pointer"
                          >
                            {row.institution_name}
                          </button>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono">{row.contracts_count}</td>
                        <td className="py-3.5 px-3 text-right font-mono">
                          RD$ {row.total_amount.toLocaleString("es-DO", { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-error">
                          {row.anomalies_count}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-xs font-semibold">
                          {row.transparency_score}%
                        </td>
                        <td className="py-3.5 pl-3 text-right">
                          <div className="inline-flex gap-3 text-xs font-semibold">
                            <button
                              type="button"
                              onClick={() => navigate(`/public/institution/${row.institution_id}`)}
                              className="text-primary hover:underline cursor-pointer"
                            >
                              Perfil
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/public?institution_id=${row.institution_id}`)}
                              className="text-on-surface-variant hover:text-primary hover:underline cursor-pointer"
                            >
                              Contratos
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </SectionContainer>
      </main>

      <Footer />
    </div>
  )
}