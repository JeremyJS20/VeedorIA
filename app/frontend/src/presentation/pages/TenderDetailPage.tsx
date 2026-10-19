import { useNavigate, useParams } from "react-router-dom"
import { AlertTriangle, ArrowLeft, Building2, FileText, Package, UserCheck } from "lucide-react"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import SectionContainer from "../components/SectionContainer"
import { usePublicTenderDetail } from "../hooks/usePublicPortal"

export default function TenderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const contractId = id ? Number(id) : undefined
  const { data: detail, isLoading, isError } = usePublicTenderDetail(contractId)

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
              Cargando expediente OCDS...
            </div>
          ) : isError || !detail ? (
            <div className="glass rounded-3xl p-12 text-center space-y-4">
              <p className="text-lg font-bold text-on-surface">Contratación no encontrada</p>
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
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold">
                      Proceso: {detail.dgcp_code}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-surface-container-low font-mono text-xs text-outline">
                      Contrato: {detail.contract_code}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                      {detail.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] uppercase tracking-wider text-outline block">
                      Monto Total Adjudicado
                    </span>
                    <span className="text-2xl md:text-3xl font-mono font-bold text-primary">
                      RD${" "}
                      {detail.amount_adjudicated.toLocaleString("es-DO", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                <div>
                  <h1 className="text-2xl md:text-3xl font-display font-bold text-on-surface mb-2">
                    {detail.title}
                  </h1>
                  {detail.object_description && detail.object_description !== detail.title && (
                    <p className="text-sm text-on-surface-variant">{detail.object_description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-outline-variant/20">
                  <div className="p-4 rounded-2xl bg-surface-container-low flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-outline block">
                        Institución Contratante
                      </span>
                      <p className="text-sm font-bold text-on-surface">{detail.institution_name}</p>
                    </div>
                    {detail.institution_id && (
                      <button
                        type="button"
                        onClick={() => navigate(`/public/institution/${detail.institution_id}`)}
                        className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-on-primary transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Perfil</span>
                      </button>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-container-low flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-outline block">
                        Proveedor Adjudicado (RPE: {detail.supplier_rpe})
                      </span>
                      <p className="text-sm font-bold text-on-surface">{detail.supplier_name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/public/supplier/${encodeURIComponent(
                            detail.supplier_rpe !== "N/A" ? detail.supplier_rpe : detail.supplier_name,
                          )}`,
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold hover:bg-sky-500 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Historial</span>
                    </button>
                  </div>
                </div>
              </div>

              {detail.anomalies.length > 0 && (
                <section className="glass rounded-3xl p-6 md:p-8 border border-error/30 space-y-4">
                  <h2 className="text-xl font-display font-bold text-error flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Hallazgos de Gobernanza Detectados por IA ({detail.anomalies.length})</span>
                  </h2>
                  <div className="space-y-3">
                    {detail.anomalies.map((a) => (
                      <div
                        key={a.id}
                        className="p-4 rounded-2xl bg-error/10 border border-error/25 flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-error text-white text-[11px] font-mono font-bold">
                              {a.anomaly_type}
                            </span>
                            <span className="text-xs font-mono font-bold text-error">
                              Severidad: {a.severity}%
                            </span>
                          </div>
                          <p className="text-sm text-on-surface">{a.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="glass rounded-3xl p-6 md:p-8 border border-outline-variant/25 space-y-4">
                <h2 className="text-xl font-display font-bold text-on-surface flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  <span>Renglones y Artículos Adjudicados ({detail.items.length})</span>
                </h2>
                {detail.items.length === 0 ? (
                  <p className="text-sm text-outline py-6 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>No hay desglose de ítems unitarios registrado para este contrato.</span>
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-outline-variant/25 text-[11px] uppercase tracking-wider text-outline">
                          <th className="py-3 pr-4">Descripción del Artículo</th>
                          <th className="py-3 px-4">UNSPSC</th>
                          <th className="py-3 px-4 text-right">Cantidad</th>
                          <th className="py-3 px-4 text-right">Precio Unitario</th>
                          <th className="py-3 pl-4 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/15">
                        {detail.items.map((it) => (
                          <tr key={it.id} className="hover:bg-surface-container-low/60">
                            <td className="py-3 pr-4 font-medium text-on-surface">{it.description}</td>
                            <td className="py-3 px-4 font-mono text-xs text-outline">{it.unspsc_code}</td>
                            <td className="py-3 px-4 text-right font-mono">
                              {it.quantity.toLocaleString("es-DO")} {it.unit}
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              RD$ {it.unit_price.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 pl-4 text-right font-mono font-bold text-primary">
                              RD$ {it.total_amount.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </SectionContainer>
      </main>

      <Footer />
    </div>
  )
}