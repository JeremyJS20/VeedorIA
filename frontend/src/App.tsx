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

function App() {
  return (
    <>
      <Toast.Provider />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/app"
          element={
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-background text-on-surface">Cargando...</div>}>
              <DashboardLayout />
            </Suspense>
          }
        >
          <Route index element={<Navigate to="bandeja" replace />} />
          <Route
            path="bandeja"
            element={
              <Suspense fallback={<div className="flex items-center justify-center h-full text-outline">Cargando...</div>}>
                <AuditorPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </>
  )
}

export default App
