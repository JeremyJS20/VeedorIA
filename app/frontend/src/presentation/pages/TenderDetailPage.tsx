import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
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
        <SectionContainer className="space-y-6">
          <button
            type="button"
            onClick={() => navigate("/public")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Portal Ciudadano</span>
          </button>

          {isLoading ? (
            <div className="bg-surface rounded-lg p-12 border border-outline-variant/30 text-center text-outline text-sm">
              Cargando expediente...
            </div>
          ) : isError || !detail ? (
            <div className="bg-surface rounded-lg p-12 border border-outline-variant/30 text-center space-y-4">
              <p className="text-base font-bold text-on-surface">Contratación no encontrada</p>
              <button
                type="button"
                onClick={() => navigate("/public")}
                className="px-4 py-2 rounded bg-primary text-on-primary text-xs font-semibold cursor-pointer"
              >
                Ir al Portal Ciudadano
              </button>
            </div>
          ) : (
            <>
              <div className="bg-surface rounded-lg p-6 md:p-8 border border-outline-variant/30 shadow-sm space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-mono text-outline">
                      Proceso {detail.dgcp_code} · Contrato {detail.contract_code} · Estado: {detail.status}
                    </p>
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-on-surface">
                      {detail.title}
                    </h1>
                    {detail.object_description && detail.object_description !== detail.title && (
                      <p className="text-sm text-on-surface-variant">{detail.object_description}</p>
                    )}
                  </div>
                  <div className="text-left md:text-right shrink-0">
                    <span className="text-[11px] uppercase tracking-wider text-outline block">
                      Monto Adjudicado
                    </span>
                    <span className="text-2xl font-mono font-bold text-primary">
                      RD${" "}
                      {detail.amount_adjudicated.toLocaleString("es-DO", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-outline-variant/20">
                  <div className="p-4 rounded bg-surface-container-low flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-outline block">
                        Institución Contratante
                      </span>
                      <p className="text-sm font-semibold text-on-surface">{detail.institution_name}</p>
                    </div>
                    {detail.institution_id && (
                      <button
                        type="button"
                        onClick={() => navigate(`/public/institution/${detail.institution_id}`)}
                        className="text-xs font-semibold text-primary hover:underline shrink-0 cursor-pointer"
                      >
                        Ver institución →
                      </button>
                    )}
                  </div>

                  <div className="p-4 rounded bg-surface-container-low flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-outline block">
                        Proveedor Adjudicado (RPE: {detail.supplier_rpe})
                      </span>
                      <p className="text-sm font-semibold text-on-surface">{detail.supplier_name}</p>
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
                      className="text-xs font-semibold text-primary hover:underline shrink-0 cursor-pointer"
                    >
                      Ver proveedor →
                    </button>
                  </div>
                </div>
              </div>

              {detail.anomalies.length > 0 && (
                <section className="bg-surface rounded-lg p-6 md:p-8 border border-error/30 shadow-sm space-y-4">
                  <h2 className="text-lg font-display font-bold text-error">
                    Hallazgos de Auditoría ({detail.anomalies.length})
                  </h2>
                  <div className="divide-y divide-outline-variant/20">
                    {detail.anomalies.map((a) => (
                      <div key={a.id} className="py-3 space-y-1">
                        <p className="text-xs font-mono text-error font-semibold">
                          {a.anomaly_type} · Severidad {a.severity}%
                        </p>
                        <p className="text-sm text-on-surface">{a.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="bg-surface rounded-lg p-6 md:p-8 border border-outline-variant/30 shadow-sm space-y-4">
                <h2 className="text-lg font-display font-bold text-on-surface">
                  Renglones Adjudicados ({detail.items.length})
                </h2>
                {detail.items.length === 0 ? (
                  <p className="text-sm text-outline py-4">
                    No hay desglose de ítems unitarios registrado para este contrato.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-outline-variant/25 text-[11px] uppercase tracking-wider text-outline">
                          <th className="py-3 pr-4">Descripción</th>
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
                            <td className="py-3 pl-4 text-right font-mono font-semibold text-on-surface">
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