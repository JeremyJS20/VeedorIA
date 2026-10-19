import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Award, Building2, Search } from "lucide-react"
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
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold uppercase tracking-widest text-primary">
              <Award className="w-3.5 h-3.5" />
              <span>Índice Nacional de Transparencia Institucional</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold">
              Ranking de Transparencia en Compras Públicas
            </h1>
            <p className="text-sm md:text-base text-on-surface-variant">
              Evaluación algorítmica continua sobre las instituciones del Estado Dominicano basada en el volumen contratado y la incidencia de alertas de IA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass rounded-2xl p-5 border border-outline-variant/25">
              <span className="text-[11px] uppercase tracking-wider text-outline block">
                Instituciones Evaluadas
              </span>
              <span className="text-3xl font-mono font-bold text-primary">
                {ranking?.total_institutions ?? "..."}
              </span>
            </div>
            <div className="glass rounded-2xl p-5 border border-outline-variant/25">
              <span className="text-[11px] uppercase tracking-wider text-outline block">
                Promedio Nacional de Transparencia
              </span>
              <span className="text-3xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {ranking?.avg_transparency ?? "..."}%
              </span>
            </div>
            <div className="glass rounded-2xl p-5 border border-outline-variant/25">
              <span className="text-[11px] uppercase tracking-wider text-outline block">
                Volumen Total Auditado
              </span>
              <span className="text-2xl font-mono font-bold text-on-surface">
                RD${" "}
                {((ranking?.total_audited_amount || 0) / 1_000_000_000).toFixed(2)} Mil Millones
              </span>
            </div>
          </div>

          <section className="glass rounded-3xl p-6 md:p-8 border border-outline-variant/25 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-outline absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrar institución por nombre..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-outline">Ordenar por:</span>
                {(
                  [
                    { key: "amount", label: "Mayor Volumen (RD$)" },
                    { key: "anomalies", label: "Más Alertas IA" },
                    { key: "transparency", label: "Mayor Transparencia" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSortBy(opt.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
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
              <div className="py-12 text-center text-outline">Calculando ranking institucional...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/25 text-[11px] uppercase tracking-wider text-outline">
                      <th className="py-3 pr-3">#</th>
                      <th className="py-3 px-3">Institución del Estado</th>
                      <th className="py-3 px-3 text-right">Contratos</th>
                      <th className="py-3 px-3 text-right">Volumen Contratado</th>
                      <th className="py-3 px-3 text-right">Alertas IA</th>
                      <th className="py-3 px-3">Índice Transparencia</th>
                      <th className="py-3 pl-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15">
                    {items.map((row, idx) => {
                      const badgeColor =
                        row.transparency_score >= 85
                          ? "bg-emerald-500"
                          : row.transparency_score >= 60
                            ? "bg-amber-500"
                            : "bg-error"
                      return (
                        <tr key={row.institution_id} className="hover:bg-surface-container-low/60">
                          <td className="py-3.5 pr-3 font-mono text-xs text-outline">{idx + 1}</td>
                          <td className="py-3.5 px-3 font-semibold text-on-surface">
                            <button
                              type="button"
                              onClick={() => navigate(`/public/institution/${row.institution_id}`)}
                              className="text-left hover:text-primary inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Building2 className="w-4 h-4 text-primary shrink-0" />
                              <span>{row.institution_name}</span>
                            </button>
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono">{row.contracts_count}</td>
                          <td className="py-3.5 px-3 text-right font-mono font-semibold">
                            RD$ {row.total_amount.toLocaleString("es-DO", { maximumFractionDigits: 0 })}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-bold text-error">
                            {row.anomalies_count}
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 rounded-full bg-surface-container-highest overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${badgeColor}`}
                                  style={{ width: `${row.transparency_score}%` }}
                                />
                              </div>
                              <span className="font-mono text-xs font-bold">{row.transparency_score}%</span>
                            </div>
                          </td>
                          <td className="py-3.5 pl-3 text-right">
                            <div className="inline-flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => navigate(`/public/institution/${row.institution_id}`)}
                                className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-on-primary cursor-pointer"
                              >
                                Perfil
                              </button>
                              <button
                                type="button"
                                onClick={() => navigate(`/public?institution_id=${row.institution_id}`)}
                                className="px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs font-bold hover:border-primary cursor-pointer"
                              >
                                Contratos
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
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