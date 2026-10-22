import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import SectionContainer from "../components/SectionContainer"
import Button from "../components/ui/Button"
import BudgetSankeyCard from "../components/public/BudgetSankeyCard"
import ProvincialSpendCard from "../components/public/ProvincialSpendCard"
import { usePublicBudgetOverview } from "../hooks/usePublicPortal"

export default function BudgetFlowPage() {
  const navigate = useNavigate()
  const [selectedProvince, setSelectedProvince] = useState("")
  const { data: overview, isLoading, isError, isFetching, refetch } = usePublicBudgetOverview()

  const selectedProvinceLabel =
    overview?.provinces.find((province) => province.id === selectedProvince)?.province ?? ""

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-4 md:px-8">
        <SectionContainer className="space-y-6">
          <header className="bg-surface rounded-lg p-6 md:p-8 border border-outline-variant/30 shadow-sm">
            <button
              type="button"
              onClick={() => navigate("/public")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al buscador ciudadano</span>
            </button>

            <h1 className="text-[28px] md:text-[32px] font-display font-bold text-on-surface">
              Flujo del Gasto Público
            </h1>
            <p className="text-sm md:text-base text-on-surface-variant mt-2 max-w-3xl">
              De dónde sale el dinero y a quién llega: concentración de las contrataciones adjudicadas entre
              instituciones y proveedores, y el volumen total por provincia.
            </p>
          </header>

          {isLoading && !overview && (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-outline">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Cargando flujo presupuestario...</span>
            </div>
          )}

          {isError && !overview && (
            <div className="bg-surface rounded-lg p-8 border border-error/30 text-center space-y-3">
              <p className="text-sm text-on-surface-variant">
                No pudimos cargar el flujo presupuestario.
              </p>
              <Button variant="secondary" size="sm" onPress={() => refetch()} isDisabled={isFetching}>
                Reintentar
              </Button>
            </div>
          )}

          {overview && (
            <>
              {overview.sankey.links.length > 0 ? (
                <BudgetSankeyCard
                  institutions={overview.sankey.institutions}
                  suppliers={overview.sankey.suppliers}
                  links={overview.sankey.links}
                  totalFlowAmount={overview.sankey.total_flow_amount}
                />
              ) : (
                <p className="text-sm text-on-surface-variant text-center py-8">
                  Todavía no hay flujos institución → proveedor para graficar.
                </p>
              )}

              {overview.provinces.length > 0 && (
                <div className="mx-auto w-full lg:max-w-[640px]">
                  <ProvincialSpendCard
                    provinces={overview.provinces}
                    selectedProvince={selectedProvince}
                    coveragePct={overview.provinces_meta?.coverage_pct}
                    onSelectProvince={setSelectedProvince}
                  />
                </div>
              )}

              {selectedProvince && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-outline-variant/30 bg-surface p-4">
                  <p className="text-sm text-on-surface-variant">
                    Provincia seleccionada:{" "}
                    <span className="font-semibold text-on-surface">
                      {selectedProvinceLabel || selectedProvince}
                    </span>
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onPress={() => navigate(`/public?province=${encodeURIComponent(selectedProvince)}`)}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>Ver sus contrataciones</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </Button>
                </div>
              )}
            </>
          )}
        </SectionContainer>
      </main>

      <Footer />
    </div>
  )
}
