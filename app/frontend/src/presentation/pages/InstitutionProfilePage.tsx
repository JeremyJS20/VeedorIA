import { useNavigate, useParams } from "react-router-dom"
import { AlertTriangle, ArrowLeft, Award, Building2, UserCheck } from "lucide-react"
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
        <SectionContainer className="space-y-8">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/public")}
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Buscador Ciudadano</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/ranking")}
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Ver Ranking Nacional</span>
            </button>
          </div>

          {isLoading ? (
            <div className="glass rounded-3xl p-12 text-center text-outline">
              Cargando perfil público de la institución...
            </div>
          ) : isError || !profile ? (
            <div className="glass rounded-3xl p-12 text-center space-y-4">
              <p className="text-lg font-bold text-on-surface">Institución no encontrada</p>
              <button
                type="button"
                onClick={() => navigate("/ranking")}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold cursor-pointer"
              >
                Ir al Ranking Institucional
              </button>
            </div>
          ) : (
            <>
              <div className="glass rounded-3xl p-6 md:p-8 border border-outline-variant/25 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold inline-flex items-center gap-1 mb-2">
                      <Building2 className="w-3.5 h-3.5" />
                      Código DGCP: {profile.dgcp_id}
                    </span>
                    <h1 className="text-2xl md:text-4xl font-display font-bold text-on-surface">
                      {profile.name}
                    </h1>
                  </div>
                  <div className="text-left md:text-right">
                    <span className="text-[11px] uppercase tracking-wider text-outline block">
                      Índice de Transparencia IA
                    </span>
                    <span
                      className={`text-3xl font-mono font-bold ${
                        profile.transparency_score >= 85
                          ? "text-emerald-600 dark:text-emerald-400"
                          : profile.transparency_score >= 60
                            ? "text-amber-500"
                            : "text-error"
                      }`}
                    >
                      {profile.transparency_score}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-outline-variant/20">
                  <div className="p-4 rounded-2xl bg-surface-container-low">
                    <span className="text-[10px] uppercase tracking-wider text-outline block">
                      Volumen Contratado
                    </span>
                    <span className="text-lg font-mono font-bold text-primary">
                      RD$ {profile.total_amount.toLocaleString("es-DO", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-container-low">
                    <span className="text-[10px] uppercase tracking-wider text-outline block">
                      Procesos Publicados
                    </span>
                    <span className="text-xl font-mono font-bold text-on-surface">
                      {profile.processes_count}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-container-low">
                    <span className="text-[10px] uppercase tracking-wider text-outline block">
                      Contratos Adjudicados
                    </span>
                    <span className="text-xl font-mono font-bold text-on-surface">
                      {profile.contracts_count}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-container-low">
                    <span className="text-[10px] uppercase tracking-wider text-outline block">
                      Alertas IA Detectadas
                    </span>
                    <span className="text-xl font-mono font-bold text-error">
                      {profile.anomalies_count}
                    </span>
                  </div>
                </div>
              </div>

              {profile.anomalies.length > 0 && (
                <section className="glass rounded-3xl p-6 md:p-8 border border-error/30 space-y-4">
                  <h2 className="text-xl font-display font-bold text-error flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Alertas de IA en esta Institución ({profile.anomalies.length})</span>
                  </h2>
                  <div className="space-y-3">
                    {profile.anomalies.map((a) => (
                      <div key={a.id} className="p-4 rounded-2xl bg-error/10 border border-error/25 flex items-center justify-between gap-4">
                        <div>
                          <span className="px-2 py-0.5 rounded bg-error text-white text-[10px] font-mono font-bold mr-2">
                            {a.anomaly_type}
                          </span>
                          <span className="text-sm text-on-surface">{a.description}</span>
                        </div>
                        {a.contract_id && (
                          <button
                            type="button"
                            onClick={() => navigate(`/public/process/${a.contract_id}`)}
                            className="px-3 py-1.5 rounded-xl bg-error text-white text-xs font-bold shrink-0 cursor-pointer"
                          >
                            Ver Contrato
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="glass rounded-3xl p-6 md:p-8 border border-outline-variant/25 space-y-4">
                <h2 className="text-xl font-display font-bold text-on-surface">
                  Principales Contratos Adjudicados ({profile.contracts.length})
                </h2>
                <div className="space-y-3">
                  {profile.contracts.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-2xl bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div>
                        <span className="text-xs font-mono text-primary font-bold mr-2">{c.dgcp_code}</span>
                        <span className="text-xs font-mono text-outline">Contrato: {c.contract_code}</span>
                        <p className="text-sm font-bold text-on-surface mt-0.5">{c.title}</p>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/public/supplier/${encodeURIComponent(
                                c.supplier_rpe !== "N/A" ? c.supplier_rpe : c.supplier_name,
                              )}`,
                            )
                          }
                          className="text-xs text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 mt-1 cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{c.supplier_name} (RPE: {c.supplier_rpe})</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-base font-mono font-bold text-on-surface">
                          RD$ {c.amount_adjudicated.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <button
                          type="button"
                          onClick={() => navigate(`/public/process/${c.id}`)}
                          className="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold cursor-pointer"
                        >
                          Ficha OCDS
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