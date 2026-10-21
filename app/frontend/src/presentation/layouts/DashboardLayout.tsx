import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { useTheme } from "@heroui/react"
import {
  ShieldCheck,
  UserCircle,
  LogOut,
  Sun,
  Globe,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  CreditCard,
  Eye,
  Check,
} from "lucide-react"
import { PREVIEW_PROFILES } from "../../domain/previewProfiles"
import Logo from "../components/Logo"
import NavItem from "../components/nav/NavItem"
import NavSection from "../components/nav/NavSection"
import NavAccordion from "../components/nav/NavAccordion"
import { buildNavGroups } from "../components/nav/navModel"
import { useAuth } from "../context/AuthContext"
import isotipoLight from "../../assets/veedoria_isotipo_light.webp"
import isotipoDark from "../../assets/veedoria_isotipo_dark.webp"

const SIDEBAR_EXPANDED = 268
const SIDEBAR_COLLAPSED = 80


export default function DashboardLayout() {
  const { t, i18n } = useTranslation("dashboard")
  const location = useLocation()
  const navigate = useNavigate()
  const { resolvedTheme, setTheme } = useTheme()
  const { user, realUser, previewProfile, isPreviewing, setPreviewCode, logout, hasPermission } = useAuth()
  const isDark = resolvedTheme === "dark"

  const [collapsed, setCollapsed] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const isotipo = isDark ? isotipoDark : isotipoLight
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const sbw = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED

  const handleLogout = async () => {
    setProfileOpen(false)
    await logout()
    navigate("/login", { replace: true })
  }

  const initials = (user?.nombre || "VD")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  const pageTitleMap: Record<string, string> = {
    "/app/dashboard": "Panorama Ejecutivo",
    "/app/mercado": "Inteligencia de Mercado por Rubro",
    "/app/oportunidades": "Radar de Oportunidades B2B",
    "/app/mis-licitaciones": "Mis Licitaciones y Pipeline",
    "/app/simulador-precios": "Simulador de Precios y Cuartiles",
    "/app/competidor": "Ficha Forense de Competidor",
    "/app/sectores": "Sectores y Rubros Monitoreados",
    "/app/suscripcion": "Suscripción y Cuotas B2B",
    "/app/bandeja": "Bandeja de Anomalías",
    "/app/procesos": "Procesos Institucionales",
    "/app/red-colusion": "Red de Colusión",
    "/app/configuracion-deteccion": "Parámetros y Topes de Detección",
    "/app/sincronizacion": "Sincronización DGCP y Cola",
    "/app/calibracion": "Calibración del Motor Estadístico",
    "/app/bitacora": "Bitácora del Sistema",
    "/app/soporte": "Centro de Soporte y Servicios",
    "/app/resoluciones": "Historial de Resoluciones",
    "/app/reportes": "Reportes de Cumplimiento",
    "/app/integraciones": "Integraciones Institucionales",
    "/app/usuarios": user?.rol?.codigo === "PLATFORM_ADMIN" ? "Usuarios y Organizaciones" : "Usuarios y Equipo",
    "/app/roles": "Roles y Planes de Servicio",
    "/app/perfil": "Mi Perfil Institucional",
  }

  const navGroups = buildNavGroups({
    tenantType: user?.tenant?.tipo,
    roleCode: user?.rol?.codigo,
    hasPermission,
  })

  const currentBreadcrumb = pageTitleMap[location.pathname] || "Consola Operativa"

  return (
    <div className="flex min-h-screen bg-background text-on-surface overflow-hidden">
      <aside
        className="h-screen fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant/30 flex flex-col z-50 transition-all duration-300"
        style={{ width: sbw }}
      >
        <div className="h-16 flex items-center justify-center mb-4 relative border-b border-outline-variant/15">
          {collapsed ? (
            <button
              type="button"
              onClick={() => navigate("/")}
              className="h-9 cursor-pointer"
              title="Ir al inicio"
            >
              <img src={isotipo} alt="VeedorIA" className="h-full w-auto" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/")}
              className="h-9 cursor-pointer"
              title="Ir al inicio"
            >
              <Logo className="h-full" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface border border-outline-variant/40 rounded-md shadow-sm flex items-center justify-center hover:bg-surface-container-high transition-colors z-10 cursor-pointer"
            title={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
          >
            {collapsed ? (
              <PanelLeft className="w-3.5 h-3.5 text-outline" />
            ) : (
              <PanelLeftClose className="w-3.5 h-3.5 text-outline" />
            )}
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto ${collapsed ? "px-2" : "px-3"} space-y-6 pb-6`}>
          {navGroups.map((group) => (
            <NavSection key={group.id} title={group.title} collapsed={collapsed}>
              {group.entries.map((entry, index) => {
                if (entry.kind === "heading") {
                  if (collapsed) return null
                  return (
                    <p
                      key={`heading-${index}`}
                      className="px-3 pt-2 text-[11px] font-bold text-outline uppercase tracking-widest mb-2"
                    >
                      {entry.label}
                    </p>
                  )
                }

                if (entry.kind === "accordion") {
                  return (
                    <NavAccordion
                      key={entry.id}
                      label={entry.label}
                      icon={entry.icon}
                      basePath={entry.basePath}
                      defaultSection={entry.defaultSection}
                      items={entry.items}
                      collapsed={collapsed}
                    />
                  )
                }

                return (
                  <NavItem
                    key={entry.to}
                    to={entry.to}
                    label={entry.label}
                    icon={entry.icon}
                    collapsed={collapsed}
                  />
                )
              })}
            </NavSection>
          ))}
        </div>
      </aside>

      <main
        className="flex-1 flex flex-col h-screen overflow-hidden bg-background transition-all duration-300"
        style={{ marginLeft: sbw }}
      >
        <header className="h-16 flex items-center justify-between px-8 bg-surface/80 backdrop-blur-md z-40 border-b border-outline-variant/15">
          <nav className="flex items-center space-x-2 text-[13px] text-outline">
            <span className="hover:text-primary transition-colors">Consola</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-on-surface font-semibold">{currentBreadcrumb}</span>
          </nav>

          {/* Menú Unificado de Usuario, Organización y Rol (Esquina Superior Derecha) */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/30 hover:border-primary/40 transition-all cursor-pointer"
            >
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full border border-primary/25 bg-primary/15 flex items-center justify-center">
                  <span className="text-primary font-bold text-xs">{initials}</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-surface rounded-full" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-on-surface leading-tight">
                  {user?.nombre || "Usuario"}
                </p>
                <p className="text-[11px] font-medium text-on-surface-variant leading-tight mt-0.5">
                  {user?.tenant?.codigo || user?.rol?.nombre || "Sesión activa"}
                </p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-outline transition-transform duration-200 ${
                  profileOpen ? "rotate-180 text-primary" : ""
                }`}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-[280px] bg-surface shadow-xl rounded-xl border border-outline-variant/35 overflow-hidden z-50">
                {/* Resumen Unificado de Identidad y Rol */}
                <div className="p-4 bg-surface-container-low border-b border-outline-variant/20">
                  <p className="text-sm font-bold text-on-surface leading-snug">
                    {user?.nombre}
                  </p>
                  <p className="text-xs font-mono text-on-surface-variant mt-0.5">
                    {user?.correo}
                  </p>
                  <div className="mt-2">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-primary/15 text-primary">
                      {user?.rol?.nombre}
                      {user?.tenant?.codigo ? ` · ${user.tenant.codigo}` : ""}
                    </span>
                  </div>
                </div>

                {/* Opciones de Cuenta y Apariencia */}
                <div className="py-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false)
                      navigate("/app/perfil")
                    }}
                    className="w-full flex items-center px-4 py-2 text-[13px] text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors cursor-pointer"
                  >
                    <UserCircle className="w-4 h-4 mr-3" />
                    Mi Perfil y Contraseña
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false)
                      navigate("/app/suscripcion")
                    }}
                    className="w-full flex items-center px-4 py-2 text-[13px] text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4 mr-3" />
                    Mi Plan y Suscripción
                  </button>
                  <button
                    type="button"
                    onClick={() => i18n.changeLanguage(i18n.language === "es" ? "en" : "es")}
                    className="w-full flex items-center px-4 py-2 text-[13px] text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors cursor-pointer"
                  >
                    <Globe className="w-4 h-4 mr-3" />
                    {t("header.language")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                    className="w-full flex items-center px-4 py-2 text-[13px] text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors cursor-pointer"
                  >
                    <Sun className="w-4 h-4 mr-3" />
                    {t(isDark ? "header.light_mode" : "header.dark_mode")}
                  </button>
                  {realUser?.rol?.codigo === "PLATFORM_ADMIN" && (
                    <>
                      <div className="border-t border-outline-variant/15 my-1" />
                      <div className="px-4 py-2">
                        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-outline mb-1.5">
                          <Eye className="w-3 h-3" />
                          Ver la consola como
                        </p>
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewCode(null)
                              setProfileOpen(false)
                            }}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] transition-colors cursor-pointer ${
                              !isPreviewing
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-on-surface-variant hover:bg-surface-container-low"
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            <span className="flex-1 text-left truncate">Mi rol real (Admin general)</span>
                            {!isPreviewing && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                          {PREVIEW_PROFILES.map((profile) => {
                            const active = previewProfile?.code === profile.code
                            return (
                              <button
                                key={profile.code}
                                type="button"
                                title={profile.description}
                                onClick={() => {
                                  setPreviewCode(profile.code)
                                  setProfileOpen(false)
                                }}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] transition-colors cursor-pointer ${
                                  active
                                    ? "bg-primary/10 text-primary font-semibold"
                                    : "text-on-surface-variant hover:bg-surface-container-low"
                                }`}
                              >
                                <UserCircle className="w-3.5 h-3.5 shrink-0" />
                                <span className="flex-1 text-left truncate">{profile.label}</span>
                                {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}
                  <div className="border-t border-outline-variant/15 my-1" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-[13px] text-error hover:bg-error-container/30 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {isPreviewing && previewProfile && (
            <div className="sticky top-0 z-40 px-4 sm:px-6 py-2 bg-amber-500/15 border-b border-amber-500/30 backdrop-blur-sm flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-[11px] font-semibold text-amber-800 dark:text-amber-200">
                <Eye className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Vista previa como <strong>{previewProfile.label}</strong> · la navegación y los permisos
                  reflejan ese rol, pero la sesión y los datos siguen siendo de tu usuario administrador.
                </span>
              </p>
              <button
                type="button"
                onClick={() => setPreviewCode(null)}
                className="shrink-0 h-7 px-2.5 rounded-lg bg-amber-600 text-white text-[11px] font-bold hover:opacity-90"
              >
                Volver a mi rol
              </button>
            </div>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  )
}
