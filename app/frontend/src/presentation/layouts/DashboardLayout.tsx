import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { useTheme } from "@heroui/react"
import {
  LayoutDashboard,
  TrendingUp,
  Bell,
  Lock,
  Share2,
  Brain,
  Users,
  ShieldCheck,
  UserCircle,
  Search,
  LogOut,
  Sun,
  Globe,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  ExternalLink,
  Check,
} from "lucide-react"
import Logo from "../components/Logo"
import { useAuth } from "../context/AuthContext"
import isotipoLight from "../../assets/veedoria_isotipo_light.webp"
import isotipoDark from "../../assets/veedoria_isotipo_dark.webp"

const SIDEBAR_EXPANDED = 268
const SIDEBAR_COLLAPSED = 80

const DEMO_ACCOUNTS = [
  {
    correo: "admin@veedoria.gob.do",
    organizacion: "NexoDigital Solutions",
    rol: "Administrador General",
  },
  {
    correo: "auditor@dgcp.gob.do",
    organizacion: "DGCP",
    rol: "Fiscalización Nacional",
  },
  {
    correo: "auditor@mopc.gob.do",
    organizacion: "MOPC",
    rol: "Auditor Institucional",
  },
  {
    correo: "auditor@minerd.gob.do",
    organizacion: "MINERD",
    rol: "Control Preventivo",
  },
  {
    correo: "proveedor@constructora.do",
    organizacion: "Constructora del Caribe",
    rol: "Proveedor RPE #132993",
  },
]

export default function DashboardLayout() {
  const { t, i18n } = useTranslation("dashboard")
  const location = useLocation()
  const navigate = useNavigate()
  const { resolvedTheme, setTheme } = useTheme()
  const { user, login, logout, hasPermission } = useAuth()
  const isDark = resolvedTheme === "dark"

  const [collapsed, setCollapsed] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [marketOpen, setMarketOpen] = useState(true)
  const [switchingEmail, setSwitchingEmail] = useState<string | null>(null)
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

  const handleQuickSwitch = async (correo: string) => {
    if (correo === user?.correo) {
      setProfileOpen(false)
      return
    }
    try {
      setSwitchingEmail(correo)
      await login(correo, "VeedorIA2026!")
      setProfileOpen(false)
    } finally {
      setSwitchingEmail(null)
    }
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
    "/app/bandeja": "Bandeja de Anomalías",
    "/app/usuarios": "Usuarios y Organizaciones",
    "/app/roles": "Roles y Planes de Servicio",
    "/app/perfil": "Mi Perfil Institucional",
  }

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
          {/* Monitoreo y Auditoría */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[11px] font-bold text-outline uppercase tracking-widest mb-2">
                Veeduría y Auditoría
              </p>
            )}

            <NavLink
              to="/app/dashboard"
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
                  <LayoutDashboard className={collapsed ? "w-5 h-5" : "mr-3 w-5 h-5 shrink-0"} />
                  {!collapsed && (
                    <span className="text-[13px] flex-1 truncate">Panorama Ejecutivo</span>
                  )}
                </>
              )}
            </NavLink>

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

            {(user?.tenant.tipo === "B2B_SUPPLIER" ||
              hasPermission("B2B_ANALYTICS") ||
              user?.rol.codigo === "PLATFORM_ADMIN") && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    if (collapsed) {
                      navigate("/app/mercado?seccion=precios")
                    } else {
                      setMarketOpen(!marketOpen)
                      if (!location.pathname.startsWith("/app/mercado")) {
                        navigate("/app/mercado?seccion=precios")
                      }
                    }
                  }}
                  className={`w-full group relative flex items-center ${collapsed ? "justify-center h-10 w-10 mx-auto" : "h-10 px-3"} rounded-lg transition-all duration-200 cursor-pointer ${
                    location.pathname.startsWith("/app/mercado")
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                  }`}
                >
                  {location.pathname.startsWith("/app/mercado") && (
                    <div
                      className={`absolute left-0 w-[4px] ${collapsed ? "h-10" : "h-6"} rounded-r bg-primary`}
                    />
                  )}
                  <TrendingUp className={collapsed ? "w-5 h-5" : "mr-3 w-5 h-5 shrink-0"} />
                  {!collapsed && (
                    <>
                      <span className="text-[13px] flex-1 text-left truncate">
                        Inteligencia de Mercado
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          marketOpen ? "rotate-180" : ""
                        }`}
                      />
                    </>
                  )}
                </button>

                {!collapsed && marketOpen && (
                  <div className="ml-5 pl-3 border-l border-outline-variant/30 space-y-0.5">
                    {[
                      { id: "precios", label: "Precios e Histórico" },
                      { id: "competidores", label: "Competidores y Compradores" },
                      { id: "procesos", label: "Adjudicaciones del Sector" },
                    ].map((sub) => {
                      const activeSec = new URLSearchParams(location.search).get("seccion") || "precios"
                      const isSubActive =
                        location.pathname.startsWith("/app/mercado") && activeSec === sub.id
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => navigate(`/app/mercado?seccion=${sub.id}`)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                            isSubActive
                              ? "text-primary font-semibold bg-primary/5"
                              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
                          }`}
                        >
                          {sub.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

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

            {/* Módulos Próximos */}
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

          {/* Gobernanza y Seguridad */}
          {(hasPermission("USER_ADMIN") || hasPermission("ROLE_VIEW")) && (
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
                        <span className="text-[13px] flex-1 truncate">Usuarios y Organizaciones</span>
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
                        <span className="text-[13px] flex-1 truncate">Roles y Planes</span>
                      )}
                    </>
                  )}
                </NavLink>
              )}
            </div>
          )}
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
              <div className="absolute right-0 top-full mt-2 w-[340px] bg-surface shadow-xl rounded-xl border border-outline-variant/35 overflow-hidden z-50">
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

                {/* Conmutador Rápido de Perfiles (Modo Demostración) */}
                <div className="p-2.5 border-b border-outline-variant/20">
                  <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-outline">
                    Cambiar Cuenta de Demostración
                  </p>
                  <div className="space-y-1">
                    {DEMO_ACCOUNTS.map((acc) => {
                      const isCurrent = user?.correo === acc.correo
                      const isSwitching = switchingEmail === acc.correo
                      return (
                        <button
                          key={acc.correo}
                          type="button"
                          disabled={Boolean(switchingEmail)}
                          onClick={() => handleQuickSwitch(acc.correo)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                            isCurrent
                              ? "bg-primary/10 text-primary font-semibold"
                              : "hover:bg-surface-container-high text-on-surface"
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="truncate font-semibold">{acc.organizacion}</p>
                            <p className="text-[11px] text-on-surface-variant truncate">{acc.rol}</p>
                          </div>
                          {isSwitching ? (
                            <span className="text-[10px] font-mono text-primary">...</span>
                          ) : isCurrent ? (
                            <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                          ) : null}
                        </button>
                      )
                    })}
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
          <Outlet />
        </div>
      </main>
    </div>
  )
}
