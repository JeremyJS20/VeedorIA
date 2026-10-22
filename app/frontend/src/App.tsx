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
import { AuthProvider } from "./presentation/context/AuthContext"
import RequireAuth from "./presentation/components/auth/RequireAuth"

const DashboardLayout = lazy(() => import("./presentation/layouts/DashboardLayout"))
const AuditorPage = lazy(() => import("./presentation/pages/AuditorPage"))
const CivicPortalPage = lazy(() => import("./presentation/pages/CivicPortalPage"))
const BudgetFlowPage = lazy(() => import("./presentation/pages/BudgetFlowPage"))
const TenderDetailPage = lazy(() => import("./presentation/pages/TenderDetailPage"))
const SupplierProfilePage = lazy(() => import("./presentation/pages/SupplierProfilePage"))
const InstitutionProfilePage = lazy(() => import("./presentation/pages/InstitutionProfilePage"))
const RankingPage = lazy(() => import("./presentation/pages/RankingPage"))
const LoginPage = lazy(() => import("./presentation/pages/LoginPage"))
const ForgotPasswordPage = lazy(() => import("./presentation/pages/ForgotPasswordPage"))
const ResetPasswordPage = lazy(() => import("./presentation/pages/ResetPasswordPage"))
const UserProfilePage = lazy(() => import("./presentation/pages/UserProfilePage"))
const UsersManagementPage = lazy(() => import("./presentation/pages/UsersManagementPage"))
const RolesMatrixPage = lazy(() => import("./presentation/pages/RolesMatrixPage"))
const InvitationGatewayPage = lazy(() => import("./presentation/pages/InvitationGatewayPage"))
const RegisterPage = lazy(() => import("./presentation/pages/RegisterPage"))
const OverviewDashboardPage = lazy(() => import("./presentation/pages/OverviewDashboardPage"))
const MarketIntelligencePage = lazy(() => import("./presentation/pages/MarketIntelligencePage"))
const InstitutionalProcessesPage = lazy(() => import("./presentation/pages/InstitutionalProcessesPage"))
const CollusionNetworkPage = lazy(() => import("./presentation/pages/CollusionNetworkPage"))
const DetectionConfigPage = lazy(() => import("./presentation/pages/DetectionConfigPage"))
const AuditResolutionsPage = lazy(() => import("./presentation/pages/AuditResolutionsPage"))
const ComplianceReportsPage = lazy(() => import("./presentation/pages/ComplianceReportsPage"))
const B2GIntegrationsPage = lazy(() => import("./presentation/pages/B2GIntegrationsPage"))
const OpportunitiesRadarPage = lazy(() => import("./presentation/pages/OpportunitiesRadarPage"))
const MyBidsPipelinePage = lazy(() => import("./presentation/pages/MyBidsPipelinePage"))
const CompetitorProfilePage = lazy(() => import("./presentation/pages/CompetitorProfilePage"))
const PriceSimulatorPage = lazy(() => import("./presentation/pages/PriceSimulatorPage"))
const SectorsExplorerPage = lazy(() => import("./presentation/pages/SectorsExplorerPage"))
const SubscriptionBillingPage = lazy(() => import("./presentation/pages/SubscriptionBillingPage"))
const SyncOperationsPage = lazy(() => import("./presentation/pages/SyncOperationsPage"))
const CalibrationConsolePage = lazy(() => import("./presentation/pages/CalibrationConsolePage"))
const AuditLogPage = lazy(() => import("./presentation/pages/AuditLogPage"))
const SupportCenterPage = lazy(() => import("./presentation/pages/SupportCenterPage"))

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
    <AuthProvider>
      <Toast.Provider className="!z-[300]" />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invitacion" element={<InvitationGatewayPage />} />
          <Route path="/join" element={<InvitationGatewayPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />
          <Route path="/restablecer-contrasena" element={<ResetPasswordPage />} />
          <Route path="/public" element={<CivicPortalPage />} />
          <Route path="/explore" element={<CivicPortalPage />} />
          <Route path="/public/budget-flow" element={<BudgetFlowPage />} />
          <Route path="/public/process/:id" element={<TenderDetailPage />} />
          <Route path="/tender/:id" element={<TenderDetailPage />} />
          <Route path="/public/supplier/:rnc" element={<SupplierProfilePage />} />
          <Route path="/public/institution/:id" element={<InstitutionProfilePage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route
            path="/app"
            element={
              <RequireAuth>
                <DashboardLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<OverviewDashboardPage />} />
            <Route
              path="mercado"
              element={
                <RequireAuth
                  permission="B2B_ANALYTICS"
                  allowedTenantTypes={["B2B_SUPPLIER", "PLATFORM", "GOV_OVERSIGHT"]}
                >
                  <MarketIntelligencePage />
                </RequireAuth>
              }
            />
            <Route
              path="oportunidades"
              element={
                <RequireAuth
                  permission="B2B_ANALYTICS"
                  allowedTenantTypes={["B2B_SUPPLIER", "PLATFORM", "GOV_OVERSIGHT"]}
                >
                  <OpportunitiesRadarPage />
                </RequireAuth>
              }
            />
            <Route
              path="mis-licitaciones"
              element={
                <RequireAuth
                  permission="B2B_ANALYTICS"
                  allowedTenantTypes={["B2B_SUPPLIER", "PLATFORM", "GOV_OVERSIGHT"]}
                >
                  <MyBidsPipelinePage />
                </RequireAuth>
              }
            />
            <Route
              path="competidor"
              element={
                <RequireAuth
                  permission="B2B_ANALYTICS"
                  allowedTenantTypes={["B2B_SUPPLIER", "PLATFORM", "GOV_OVERSIGHT"]}
                >
                  <CompetitorProfilePage />
                </RequireAuth>
              }
            />
            <Route
              path="competidor/:rnc"
              element={
                <RequireAuth
                  permission="B2B_ANALYTICS"
                  allowedTenantTypes={["B2B_SUPPLIER", "PLATFORM", "GOV_OVERSIGHT"]}
                >
                  <CompetitorProfilePage />
                </RequireAuth>
              }
            />
            <Route
              path="simulador-precios"
              element={
                <RequireAuth
                  permission="B2B_ANALYTICS"
                  allowedTenantTypes={["B2B_SUPPLIER", "PLATFORM", "GOV_OVERSIGHT"]}
                >
                  <PriceSimulatorPage />
                </RequireAuth>
              }
            />
            <Route
              path="sectores"
              element={
                <RequireAuth
                  permission="B2B_ANALYTICS"
                  allowedTenantTypes={["B2B_SUPPLIER", "PLATFORM", "GOV_OVERSIGHT"]}
                >
                  <SectorsExplorerPage />
                </RequireAuth>
              }
            />
            <Route
              path="suscripcion"
              element={
                <RequireAuth
                  allowedTenantTypes={["B2B_SUPPLIER", "PLATFORM", "GOV_OVERSIGHT"]}
                >
                  <SubscriptionBillingPage />
                </RequireAuth>
              }
            />
            <Route
              path="bandeja"
              element={
                <RequireAuth
                  permission="ANOMALY_READ"
                  allowedTenantTypes={["GOV_INSTITUTION", "GOV_OVERSIGHT", "PLATFORM"]}
                >
                  <AuditorPage />
                </RequireAuth>
              }
            />
            <Route
              path="procesos"
              element={
                <RequireAuth
                  permission="ANOMALY_READ"
                  allowedTenantTypes={["GOV_INSTITUTION", "GOV_OVERSIGHT", "PLATFORM"]}
                >
                  <InstitutionalProcessesPage />
                </RequireAuth>
              }
            />
            <Route
              path="red-colusion"
              element={
                <RequireAuth
                  permission="ANOMALY_READ"
                  allowedTenantTypes={["GOV_INSTITUTION", "GOV_OVERSIGHT", "PLATFORM"]}
                >
                  <CollusionNetworkPage />
                </RequireAuth>
              }
            />
            <Route
              path="configuracion-deteccion"
              element={
                <RequireAuth
                  permission="ANOMALY_READ"
                  allowedTenantTypes={["GOV_INSTITUTION", "GOV_OVERSIGHT", "PLATFORM"]}
                >
                  <DetectionConfigPage />
                </RequireAuth>
              }
            />
            <Route
              path="resoluciones"
              element={
                <RequireAuth
                  permission="ANOMALY_READ"
                  allowedTenantTypes={["GOV_INSTITUTION", "GOV_OVERSIGHT", "PLATFORM"]}
                >
                  <AuditResolutionsPage />
                </RequireAuth>
              }
            />
            <Route
              path="reportes"
              element={
                <RequireAuth
                  permission="ANOMALY_READ"
                  allowedTenantTypes={["GOV_INSTITUTION", "GOV_OVERSIGHT", "PLATFORM"]}
                >
                  <ComplianceReportsPage />
                </RequireAuth>
              }
            />
            <Route
              path="integraciones"
              element={
                <RequireAuth
                  permission="ANOMALY_READ"
                  allowedTenantTypes={["GOV_INSTITUTION", "GOV_OVERSIGHT", "PLATFORM"]}
                >
                  <B2GIntegrationsPage />
                </RequireAuth>
              }
            />
            <Route
              path="sincronizacion"
              element={
                <RequireAuth allowedRoles={["PLATFORM_ADMIN"]}>
                  <SyncOperationsPage />
                </RequireAuth>
              }
            />
            <Route
              path="calibracion"
              element={
                <RequireAuth allowedRoles={["PLATFORM_ADMIN"]}>
                  <CalibrationConsolePage />
                </RequireAuth>
              }
            />
            <Route
              path="bitacora"
              element={
                <RequireAuth allowedRoles={["PLATFORM_ADMIN"]}>
                  <AuditLogPage />
                </RequireAuth>
              }
            />
            <Route
              path="soporte"
              element={
                <RequireAuth allowedRoles={["PLATFORM_ADMIN"]}>
                  <SupportCenterPage />
                </RequireAuth>
              }
            />
            <Route path="perfil" element={<UserProfilePage />} />
            <Route
              path="usuarios"
              element={
                <RequireAuth
                  permission="USER_ADMIN"
                  allowedRoles={["PLATFORM_ADMIN", "TENANT_ADMIN"]}
                >
                  <UsersManagementPage />
                </RequireAuth>
              }
            />
            <Route
              path="roles"
              element={
                <RequireAuth
                  permission="ROLE_VIEW"
                  allowedRoles={["PLATFORM_ADMIN"]}
                >
                  <RolesMatrixPage />
                </RequireAuth>
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}

export default App
