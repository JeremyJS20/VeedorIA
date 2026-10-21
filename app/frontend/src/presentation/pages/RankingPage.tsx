import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search } from "lucide-react"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import SectionContainer from "../components/SectionContainer"
import DataTable from "../components/ui/DataTable"
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

            <DataTable
              rows={items}
              rowKey={(row) => row.institution_id}
              isLoading={isLoading}
              emptyMessage="No hay instituciones para el filtro seleccionado."
              columns={[
                {
                  key: "posicion",
                  header: "#",
                  cellClassName: "font-mono text-xs text-outline",
                  cell: (_row) => items.indexOf(_row) + 1,
                },
                {
                  key: "institucion",
                  header: "Institución",
                  cellClassName: "font-medium text-on-surface",
                  cell: (row) => (
                    <button
                      type="button"
                      onClick={() => navigate(`/public/institution/${row.institution_id}`)}
                      className="text-left hover:text-primary hover:underline cursor-pointer"
                    >
                      {row.institution_name}
                    </button>
                  ),
                },
                {
                  key: "contratos",
                  header: "Contratos",
                  align: "right",
                  cellClassName: "font-mono",
                  cell: (row) => row.contracts_count,
                },
                {
                  key: "volumen",
                  header: "Volumen Contratado",
                  align: "right",
                  cellClassName: "font-mono",
                  cell: (row) => `RD$ ${row.total_amount.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`,
                },
                {
                  key: "hallazgos",
                  header: "Hallazgos",
                  align: "right",
                  cellClassName: "font-mono text-error",
                  cell: (row) => row.anomalies_count,
                },
                {
                  key: "cumplimiento",
                  header: "Cumplimiento",
                  cellClassName: "font-mono text-xs font-semibold",
                  cell: (row) => `${row.transparency_score}%`,
                },
                {
                  key: "acciones",
                  header: "Acciones",
                  align: "right",
                  cell: (row) => (
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
                  ),
                },
              ]}
            />
          </section>
        </SectionContainer>
      </main>

      <Footer />
    </div>
  )
}