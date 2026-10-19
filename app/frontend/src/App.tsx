import { lazy, Suspense } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { Toast } from "@heroui/react"
import Navbar from "./presentation/components/Navbar"
import HeroSection from "./presentation/components/HeroSection"
import SocialProofSection from "./presentation/components/SocialProofSection"
import PortalsSection from "./presentation/components/PortalsSection"
import PriceCheckerSection from "./presentation/components/PriceCheckerSection"
import StatsSection from "./presentation/components/StatsSection"
import PricingSection from "./presentation/components/PricingSection"
import FAQSection from "./presentation/components/FAQSection"
import CTABanner from "./presentation/components/CTABanner"
import Footer from "./presentation/components/Footer"

const DashboardLayout = lazy(() => import("./presentation/layouts/DashboardLayout"))
const AuditorPage = lazy(() => import("./presentation/pages/AuditorPage"))
const CivicPortalPage = lazy(() => import("./presentation/pages/CivicPortalPage"))
const TenderDetailPage = lazy(() => import("./presentation/pages/TenderDetailPage"))
const SupplierProfilePage = lazy(() => import("./presentation/pages/SupplierProfilePage"))
const InstitutionProfilePage = lazy(() => import("./presentation/pages/InstitutionProfilePage"))
const RankingPage = lazy(() => import("./presentation/pages/RankingPage"))

function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <SocialProofSection />
        <PortalsSection />
        <PriceCheckerSection />
        <StatsSection />
        <PricingSection />
        <FAQSection />
        <CTABanner />
      </main>
      <Footer />
    </>
  )
}

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background text-on-surface font-mono text-sm">
    Cargando VeedorIA...
  </div>
)

function App() {
  return (
    <>
      <Toast.Provider />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/public" element={<CivicPortalPage />} />
          <Route path="/explore" element={<CivicPortalPage />} />
          <Route path="/public/process/:id" element={<TenderDetailPage />} />
          <Route path="/tender/:id" element={<TenderDetailPage />} />
          <Route path="/public/supplier/:rnc" element={<SupplierProfilePage />} />
          <Route path="/public/institution/:id" element={<InstitutionProfilePage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/app" element={<DashboardLayout />}>
            <Route index element={<Navigate to="bandeja" replace />} />
            <Route path="bandeja" element={<AuditorPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}

export default App