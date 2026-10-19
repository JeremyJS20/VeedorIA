import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { useTheme } from "@heroui/react"
import {
  Bell,
  Lock,
  Share2,
  Brain,
  Users,
  ShieldCheck,
  UserCircle,
  Search,
  MoreVertical,
  LogOut,
  Sun,
  Globe,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Building2,
  ExternalLink,
} from "lucide-react"
import Logo from "../components/Logo"
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
  const { user, logout, hasPermission } = useAuth()
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
    "/app/bandeja": "Bandeja Forense de Anomalías",
    "/app/usuarios": "Usuarios y Organizaciones (Tenants)",
    "/app/roles": "Matriz de Roles RBAC y Planes SaaS",
    "/app/perfil": "Mi Perfil Institucional",
  }

  const currentBreadcrumb = pageTitleMap[location.pathname] || "Consola Operativa"

  const scopeLabel =
    user?.tenant?.tipo === "GOV_INSTITUTION"
      ? `Alcance Institucional (ID #${user.tenant.institution_id})`
      : user?.tenant?.tipo === "B2B_SUPPLIER"
        ? `Alcance Proveedor (RPE #${user.tenant.supplier_rpe})`
        : "Alcance Nacional Transversal"

  return (
    <div className="flex min-h-screen bg-background text-on-surface overflow-hidden">
      <aside
        className="h-screen fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant/30 flex flex-col z-50 transition-all duration-300"
        style={{ width: sbw }}
      >
        <div className="h-16 flex items-center justify-center mb-2 relative">
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

        {/* Tarjeta del Tenant Activo */}
        {!collapsed && user?.tenant && (
          <div className="mx-3 mb-4 p-3 rounded-xl bg-surface border border-outline-variant/30 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                {user.tenant.plan_tier}
              </span>
              <span className="text-[10px] font-mono text-on-surface-variant">
                {user.tenant.codigo}
              </span>
            </div>
            <p className="text-xs font-bold text-on-surface mt-1.5 truncate" title={user.tenant.nombre}>
              {user.tenant.nombre}
            </p>
            <p className="text-[11px] text-on-surface-variant mt-0.5 truncate">{scopeLabel}</p>
          </div>
        )}

        <div className={`flex-1 overflow-y-auto ${collapsed ? "px-2" : "px-3"} space-y-6 pb-6`}>
          {/* Monitoreo y Auditoría */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[11px] font-bold text-outline uppercase tracking-widest mb-2">
                Veeduría y Auditoría
              </p>
            )}

            <NavLink
              to="/app/bandeja"
              className={({ isActive }) =>
                `group relative flex items-center ${collapsed ? "justify-center h-10 w-10 mx-auto" : "h-10 px-3"} rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div
                      className={`absolute left-0 w-[4px] ${collapsed ? "h-10" : "h-6"} rounded-r bg-primary`}
                    />
                  )}
                  <Bell className={collapsed ? "w-5 h-5" : "mr-3 w-5 h-5 shrink-0"} />
                  {!collapsed && (
                    <span className="text-[13px] flex-1 truncate">Bandeja de Anomalías</span>
                  )}
                </>
              )}
            </NavLink>

            <NavLink
              to="/public"
              className={`group relative flex items-center ${collapsed ? "justify-center h-10 w-10 mx-auto" : "h-10 px-3"} rounded-lg transition-all duration-200 text-on-surface-variant hover:bg-surface-container-high hover:text-primary`}
            >
              <Search className={collapsed ? "w-5 h-5" : "mr-3 w-5 h-5 shrink-0"} />
              {!collapsed && (
                <>
                  <span className="text-[13px] flex-1 truncate">Buscador Ciudadano</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </>
              )}
            </NavLink>

            {/* Módulos Enterprise / Próximos */}
            {[
              { label: t("sidebar.collusion_network"), icon: Share2 },
              { label: t("sidebar.ai_config"), icon: Brain },
            ].map((item) => (
              <div
                key={item.label}
                className={`group relative flex items-center ${collapsed ? "justify-center h-10 w-10 mx-auto" : "h-10 px-3"} rounded-lg opacity-45 cursor-not-allowed`}
              >
                <item.icon
                  className={
                    collapsed
                      ? "w-5 h-5 text-on-surface-variant"
                      : "mr-3 w-5 h-5 shrink-0 text-on-surface-variant"
                  }
                />
                {!collapsed && (
                  <>
                    <span className="text-[13px] flex-1 truncate text-on-surface-variant">
                      {item.label}
                    </span>
                    <Lock className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Administración RBAC y Multi-Tenant */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[11px] font-bold text-outline uppercase tracking-widest mb-2">
                Gobernanza y Seguridad
              </p>
            )}

            {hasPermission("USER_ADMIN") && (
              <NavLink
                to="/app/usuarios"
                className={({ isActive }) =>
                  `group relative flex items-center ${collapsed ? "justify-center h-10 w-10 mx-auto" : "h-10 px-3"} rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div
                        className={`absolute left-0 w-[4px] ${collapsed ? "h-10" : "h-6"} rounded-r bg-primary`}
                      />
                    )}
                    <Users className={collapsed ? "w-5 h-5" : "mr-3 w-5 h-5 shrink-0"} />
                    {!collapsed && (
                      <span className="text-[13px] flex-1 truncate">Usuarios y Tenants</span>
                    )}
                  </>
                )}
              </NavLink>
            )}

            {hasPermission("ROLE_VIEW") && (
              <NavLink
                to="/app/roles"
                className={({ isActive }) =>
                  `group relative flex items-center ${collapsed ? "justify-center h-10 w-10 mx-auto" : "h-10 px-3"} rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div
                        className={`absolute left-0 w-[4px] ${collapsed ? "h-10" : "h-6"} rounded-r bg-primary`}
                      />
                    )}
                    <ShieldCheck className={collapsed ? "w-5 h-5" : "mr-3 w-5 h-5 shrink-0"} />
                    {!collapsed && (
                      <span className="text-[13px] flex-1 truncate">Roles y Planes SaaS</span>
                    )}
                  </>
                )}
              </NavLink>
            )}

            <NavLink
              to="/app/perfil"
              className={({ isActive }) =>
                `group relative flex items-center ${collapsed ? "justify-center h-10 w-10 mx-auto" : "h-10 px-3"} rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div
                      className={`absolute left-0 w-[4px] ${collapsed ? "h-10" : "h-6"} rounded-r bg-primary`}
                    />
                  )}
                  <UserCircle className={collapsed ? "w-5 h-5" : "mr-3 w-5 h-5 shrink-0"} />
                  {!collapsed && <span className="text-[13px] flex-1 truncate">Mi Perfil</span>}
                </>
              )}
            </NavLink>
          </div>
        </div>

        {/* Footer de Usuario Autenticado Real */}
        <div
          className={`${collapsed ? "p-2" : "p-4"} border-t border-outline-variant/20 bg-surface-container-low/50 relative`}
          ref={profileRef}
        >
          <button
            type="button"
            onClick={() => !collapsed && setProfileOpen(!profileOpen)}
            className={`w-full flex items-center ${collapsed ? "justify-center" : "gap-3"} p-2 rounded-xl transition-all hover:bg-surface-container-high active:scale-[0.98] group cursor-pointer`}
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-xs">{initials}</span>
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[13px] font-semibold text-on-surface leading-tight truncate">
                    {user?.nombre}
                  </p>
                  <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider bg-primary/15 text-primary truncate max-w-full">
                    {user?.rol?.nombre || "Usuario"}
                  </span>
                </div>
                <MoreVertical className="w-4 h-4 text-outline group-hover:text-primary transition-colors shrink-0" />
              </>
            )}
          </button>

          {!collapsed && profileOpen && (
            <div className="absolute bottom-20 left-4 right-4 bg-surface shadow-xl rounded-xl border border-outline-variant/30 overflow-hidden py-2 z-50">
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
              <div className="border-t border-outline-variant/10 my-1" />
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-[13px] text-error hover:bg-error-container/30 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Cerrar Sesión Institucional
              </button>
            </div>
          )}
        </div>
      </aside>

      <main
        className="flex-1 flex flex-col h-screen overflow-hidden bg-background transition-all duration-300"
        style={{ marginLeft: sbw }}
      >
        <header className="h-16 flex items-center justify-between px-8 bg-surface/70 backdrop-blur-md z-40 border-b border-outline-variant/10">
          <nav className="flex items-center space-x-2 text-[13px] text-outline">
            <span className="hover:text-primary transition-colors">{t("header.breadcrumb_console")}</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-on-surface font-semibold">{currentBreadcrumb}</span>
          </nav>

          <div className="flex items-center gap-4">
            {user?.tenant && (
              <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/25 text-xs">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <span className="font-semibold text-on-surface">{user.tenant.nombre}</span>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {user.tenant.plan_tier}
                </span>
                <span className="text-[11px] text-on-surface-variant border-l border-outline-variant/30 pl-2">
                  {scopeLabel}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar sesión"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-error/10 text-xs font-semibold text-on-surface-variant hover:text-error transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}