import { useNavigate, useParams } from "react-router-dom"
import { AlertTriangle, ArrowLeft, Building2, CheckCircle2, MapPin, UserCheck } from "lucide-react"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import SectionContainer from "../components/SectionContainer"
import { usePublicSupplierProfile } from "../hooks/usePublicPortal"

export default function SupplierProfilePage() {
  const { rnc } = useParams<{ rnc: string }>()
  const navigate = useNavigate()
  const { data: profile, isLoading, isError } = usePublicSupplierProfile(rnc)

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-4 md:px-8">
        <SectionContainer className="space-y-8">
          <button
            type="button"
            onClick={() => navigate("/public")}
            className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Buscador Ciudadano</span>
          </button>

          {isLoading ? (
            <div className="glass rounded-3xl p-12 text-center text-outline">
              Cargando perfil público del proveedor...
            </div>
          ) : isError || !profile ? (
            <div className="glass rounded-3xl p-12 text-center space-y-4">
              <p className="text-lg font-bold text-on-surface">Proveedor no encontrado</p>
              <button
                type="button"
                onClick={() => navigate("/public")}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold cursor-pointer"
              >
                Ir al Portal Ciudadano
              </button>
            </div>
          ) : (
            <>
              <div className="glass rounded-3xl p-6 md:p-8 border border-outline-variant/25 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 font-mono text-xs font-bold inline-flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" />
                        RPE / RNC: {profile.rnc}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {profile.status}
                      </span>
                      <span className="text-xs text-outline inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {profile.province}
                      </span>
                    </div>
                    <h1 className="text-2xl md:text-4xl font-display font-bold text-on-surface">
                      {profile.name}
                    </h1>
                  </div>

                  <div className="text-left md:text-right">
                    <span className="text-[11px] uppercase tracking-wider text-outline block">
                      Total Adjudicado Histórico
                    </span>
                    <span className="text-2xl md:text-3xl font-mono font-bold text-primary">
                      RD${" "}
                      {profile.total_adjudicated.toLocaleString("es-DO", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-outline-variant/20">
                  <div className="p-4 rounded-2xl bg-surface-container-low">
                    <span className="text-[10px] uppercase tracking-wider text-outline block">
                      Contratos Adjudicados
                    </span>
                    <span className="text-2xl font-mono font-bold text-on-surface">
                      {profile.contracts_count}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-container-low">
                    <span className="text-[10px] uppercase tracking-wider text-outline block">
                      Instituciones Compradoras
                    </span>
                    <span className="text-2xl font-mono font-bold text-primary">
                      {profile.top_institutions.length}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-container-low">
                    <span className="text-[10px] uppercase tracking-wider text-outline block">
                      Alertas de IA Asociadas
                    </span>
                    <span className="text-2xl font-mono font-bold text-error">
                      {profile.anomalies_count}
                    </span>
                  </div>
                </div>
              </div>

              {profile.anomalies.length > 0 && (
                <section className="glass rounded-3xl p-6 md:p-8 border border-error/30 space-y-4">
                  <h2 className="text-xl font-display font-bold text-error flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Alertas de IA Registradas en sus Contratos ({profile.anomalies.length})</span>
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
                <h2 className="text-xl font-display font-bold text-on-surface flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <span>Historial de Contratos Ganados ({profile.contracts.length})</span>
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
                        <p className="text-xs text-on-surface-variant">{c.institution_name}</p>
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