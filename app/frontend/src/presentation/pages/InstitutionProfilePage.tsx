import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import SectionContainer from "../components/SectionContainer"
import { usePublicInstitutionProfile } from "../hooks/usePublicPortal"

export default function InstitutionProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const instId = id ? Number(id) : undefined
  const { data: profile, isLoading, isError } = usePublicInstitutionProfile(instId)

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-4 md:px-8">
        <SectionContainer className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/public")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Portal Ciudadano</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/ranking")}
              className="text-sm font-semibold text-primary hover:underline cursor-pointer"
            >
              Ver Ranking Institucional →
            </button>
          </div>

          {isLoading ? (
            <div className="bg-surface rounded-lg p-12 border border-outline-variant/30 text-center text-outline text-sm">
              Cargando perfil de la institución...
            </div>
          ) : isError || !profile ? (
            <div className="bg-surface rounded-lg p-12 border border-outline-variant/30 text-center space-y-4">
              <p className="text-base font-bold text-on-surface">Institución no encontrada</p>
              <button
                type="button"
                onClick={() => navigate("/ranking")}
                className="px-4 py-2 rounded bg-primary text-on-primary text-xs font-semibold cursor-pointer"
              >
                Ir al Ranking Institucional
              </button>
            </div>
          ) : (
            <>
              <div className="bg-surface rounded-lg p-6 md:p-8 border border-outline-variant/30 shadow-sm space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-mono text-outline">Código DGCP: {profile.dgcp_id}</p>
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-on-surface">
                      {profile.name}
                    </h1>
                  </div>
                  <div className="text-left md:text-right">
                    <span className="text-[11px] uppercase tracking-wider text-outline block">
                      Índice de Transparencia
                    </span>
                    <span className="text-2xl font-mono font-bold text-primary">
                      {profile.transparency_score}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-outline-variant/20">
                  <div className="p-4 rounded bg-surface-container-low">
                    <span className="text-[11px] uppercase tracking-wider text-outline block">
                      Volumen Contratado
                    </span>
                    <span className="text-lg font-mono font-bold text-on-surface">
                      RD$ {profile.total_amount.toLocaleString("es-DO", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="p-4 rounded bg-surface-container-low">
                    <span className="text-[11px] uppercase tracking-wider text-outline block">
                      Procesos
                    </span>
                    <span className="text-lg font-mono font-bold text-on-surface">
                      {profile.processes_count}
                    </span>
                  </div>
                  <div className="p-4 rounded bg-surface-container-low">
                    <span className="text-[11px] uppercase tracking-wider text-outline block">
                      Contratos
                    </span>
                    <span className="text-lg font-mono font-bold text-on-surface">
                      {profile.contracts_count}
                    </span>
                  </div>
                  <div className="p-4 rounded bg-surface-container-low">
                    <span className="text-[11px] uppercase tracking-wider text-outline block">
                      Hallazgos
                    </span>
                    <span className="text-lg font-mono font-bold text-error">
                      {profile.anomalies_count}
                    </span>
                  </div>
                </div>
              </div>

              {profile.anomalies.length > 0 && (
                <section className="bg-surface rounded-lg p-6 md:p-8 border border-error/30 shadow-sm space-y-4">
                  <h2 className="text-lg font-display font-bold text-error">
                    Hallazgos Registrados ({profile.anomalies.length})
                  </h2>
                  <div className="divide-y divide-outline-variant/20">
                    {profile.anomalies.map((a) => (
                      <div key={a.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className="text-xs font-mono font-semibold text-error block">
                            {a.anomaly_type}
                          </span>
                          <span className="text-sm text-on-surface">{a.description}</span>
                        </div>
                        {a.contract_id && (
                          <button
                            type="button"
                            onClick={() => navigate(`/public/process/${a.contract_id}`)}
                            className="text-xs font-semibold text-primary hover:underline shrink-0 cursor-pointer"
                          >
                            Ver contrato →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="bg-surface rounded-lg p-6 md:p-8 border border-outline-variant/30 shadow-sm space-y-4">
                <h2 className="text-lg font-display font-bold text-on-surface">
                  Principales Contratos ({profile.contracts.length})
                </h2>
                <div className="divide-y divide-outline-variant/20">
                  {profile.contracts.map((c) => (
                    <div
                      key={c.id}
                      className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-mono text-outline">
                          {c.dgcp_code} · Contrato {c.contract_code}
                        </p>
                        <p className="text-sm font-semibold text-on-surface mt-0.5">{c.title}</p>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/public/supplier/${encodeURIComponent(
                                c.supplier_rpe !== "N/A" ? c.supplier_rpe : c.supplier_name,
                              )}`,
                            )
                          }
                          className="text-xs text-on-surface-variant hover:text-primary hover:underline mt-0.5 cursor-pointer"
                        >
                          Proveedor: {c.supplier_name} (RPE: {c.supplier_rpe})
                        </button>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-sm font-mono font-bold text-on-surface">
                          RD$ {c.amount_adjudicated.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <button
                          type="button"
                          onClick={() => navigate(`/public/process/${c.id}`)}
                          className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                        >
                          Ver expediente →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </SectionContainer>
      </main>

      <Footer />
    </div>
  )
}