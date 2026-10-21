import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { useTheme } from "@heroui/react"
import {
  LayoutDashboard,
  TrendingUp,
  Bell,
  Share2,
  FolderKanban,
  SlidersHorizontal,
  CheckCircle2,
  FileBarChart,
  KeyRound,
  Users,
  ShieldCheck,
  UserCircle,
  LogOut,
  Sun,
  Globe,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  Compass,
  Briefcase,
  Calculator,
  Layers,
  CreditCard,
  RefreshCw,
  ScrollText,
  LifeBuoy,
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
  const [marketOpen, setMarketOpen] = useState(true)
  const [usersOpen, setUsersOpen] = useState(true)
  const [rolesOpen, setRolesOpen] = useState(true)
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
    "/app/configuracion-deteccion": "Parámetros de Detección",
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

  const isB2GOrPlatform =
    user?.tenant?.tipo === "GOV_INSTITUTION" ||
    user?.tenant?.tipo === "GOV_OVERSIGHT" ||
    user?.tenant?.tipo === "PLATFORM" ||
    user?.rol?.codigo === "PLATFORM_ADMIN"

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
          {/* Secci?n 1: Veedur?a y Monitoreo */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[11px] font-bold text-outline uppercase tracking-widest mb-2">
                Veeduría y Monitoreo
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

            {isB2GOrPlatform && (
              <>
                {[
                  { to: "/app/bandeja", label: "Bandeja de Anomalías", icon: Bell },
                  { to: "/app/procesos", label: "Procesos Institucionales", icon: FolderKanban },
                  { to: "/app/red-colusion", label: "Red de Colusión", icon: Share2 },
                ].map((navItem) => (
                  <NavLink
                    key={navItem.to}
                    to={navItem.to}
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
                        <navItem.icon className={collapsed ? "w-5 h-5" : "mr-3 w-5 h-5 shrink-0"} />
                        {!collapsed && (
                          <span className="text-[13px] flex-1 truncate">{navItem.label}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </>
            )}

            {(user?.tenant?.tipo === "B2B_SUPPLIER" ||
              user?.tenant?.tipo === "GOV_OVERSIGHT" ||
              user?.rol?.codigo === "PLATFORM_ADMIN") &&
              hasPermission("B2B_ANALYTICS") && (
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

            {/* Suite de Licitaciones e Inteligencia Comercial B2B */}
            {(user?.tenant?.tipo === "B2B_SUPPLIER" ||
              user?.tenant?.tipo === "GOV_OVERSIGHT" ||
              user?.rol?.codigo === "PLATFORM_ADMIN") && (
              <div className="space-y-1 pt-2">
                {!collapsed && (
                  <p className="px-3 text-[11px] font-bold text-outline uppercase tracking-widest mb-2">
                    Licitaciones y Mercado B2B
                  </p>
                )}

                {[
                  { to: "/app/oportunidades", label: "Radar de Oportunidades", icon: Compass },
                  { to: "/app/mis-licitaciones", label: "Mis Licitaciones", icon: Briefcase },
                  { to: "/app/simulador-precios", label: "Simulador de Precios", icon: Calculator },
                  { to: "/app/sectores", label: "Sectores Monitoreados", icon: Layers },
                  { to: "/app/suscripcion", label: "Plan y Suscripción", icon: CreditCard },
                ].map((navItem) => (
                  <NavLink
                    key={navItem.to}
                    to={navItem.to}
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
                        <navItem.icon className={collapsed ? "w-5 h-5" : "mr-3 w-5 h-5 shrink-0"} />
                        {!collapsed && (
                          <span className="text-[13px] flex-1 truncate">{navItem.label}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Secci?n 2: Dict?menes y Cumplimiento (B2G y Administraci?n) */}
          {isB2GOrPlatform && (
            <div className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[11px] font-bold text-outline uppercase tracking-widest mb-2">
                  Dictámenes y Reportes
                </p>
              )}

              {[
                { to: "/app/resoluciones", label: "Historial de Resoluciones", icon: CheckCircle2 },
                { to: "/app/reportes", label: "Reportes de Cumplimiento", icon: FileBarChart },
              ].map((navItem) => (
                <NavLink
                  key={navItem.to}
                  to={navItem.to}
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
                      <navItem.icon className={collapsed ? "w-5 h-5" : "mr-3 w-5 h-5 shrink-0"} />
                      {!collapsed && (
                        <span className="text-[13px] flex-1 truncate">{navItem.label}</span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          )}

          {/* Secci?n 3: Calibraci?n e Interoperabilidad (B2G y Administraci?n) */}
          {isB2GOrPlatform && (
            <div className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[11px] font-bold text-outline uppercase tracking-widest mb-2">
                  Calibración y Conectores
                </p>
              )}

              {[
                { to: "/app/configuracion-deteccion", label: "Parámetros de Detección", icon: SlidersHorizontal },
                { to: "/app/integraciones", label: "Integraciones y Datos", icon: KeyRound },
              ].map((navItem) => (
                <NavLink
                  key={navItem.to}
                  to={navItem.to}
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
                      <navItem.icon className={collapsed ? "w-5 h-5" : "mr-3 w-5 h-5 shrink-0"} />
                      {!collapsed && (
                        <span className="text-[13px] flex-1 truncate">{navItem.label}</span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          )}

          {/* Operaciones de Plataforma (Solo Administradores Globales) */}
          {user?.rol?.codigo === "PLATFORM_ADMIN" && (
            <div className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[11px] font-bold text-outline uppercase tracking-widest mb-2">
                  Operaciones de Plataforma
                </p>
              )}

              {[
                { to: "/app/sincronizacion", label: "Sincronización DGCP", icon: RefreshCw },
                { to: "/app/calibracion", label: "Calibración del Motor", icon: SlidersHorizontal },
                { to: "/app/bitacora", label: "Bitácora del Sistema", icon: ScrollText },
                { to: "/app/soporte", label: "Centro de Soporte", icon: LifeBuoy },
              ].map((navItem) => (
                <NavLink
                  key={navItem.to}
                  to={navItem.to}
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
                      <navItem.icon className={collapsed ? "w-5 h-5" : "mr-3 w-5 h-5 shrink-0"} />
                      {!collapsed && (
                        <span className="text-[13px] flex-1 truncate">{navItem.label}</span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          )}

          {/* Gobernanza y Seguridad (Solo Administradores) */}
          {(hasPermission("USER_ADMIN") || user?.rol?.codigo === "PLATFORM_ADMIN") && (
            <div className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[11px] font-bold text-outline uppercase tracking-widest mb-2">
                  {user?.rol?.codigo === "PLATFORM_ADMIN"
                    ? "Gobernanza y Seguridad"
                    : "Administración"}
                </p>
              )}

              {hasPermission("USER_ADMIN") &&
                (user?.rol?.codigo === "PLATFORM_ADMIN" ? (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (collapsed) {
                          navigate("/app/usuarios?seccion=usuarios")
                        } else {
                          setUsersOpen(!usersOpen)
                          if (!location.pathname.startsWith("/app/usuarios")) {
                            navigate("/app/usuarios?seccion=usuarios")
                          }
                        }
                      }}
                      className={`w-full group relative flex items-center ${collapsed ? "justify-center h-10 w-10 mx-auto" : "h-10 px-3"} rounded-lg transition-all duration-200 cursor-pointer ${
                        location.pathname.startsWith("/app/usuarios")
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                      }`}
                    >
                      {location.pathname.startsWith("/app/usuarios") && (
                        <div
                          className={`absolute left-0 w-[4px] ${collapsed ? "h-10" : "h-6"} rounded-r bg-primary`}
                        />
                      )}
                      <Users className={collapsed ? "w-5 h-5" : "mr-3 w-5 h-5 shrink-0"} />
                      {!collapsed && (
                        <>
                          <span className="text-[13px] flex-1 text-left truncate">
                            Usuarios y Organizaciones
                          </span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              usersOpen ? "rotate-180" : ""
                            }`}
                          />
                        </>
                      )}
                    </button>

                    {!collapsed && usersOpen && (
                      <div className="ml-5 pl-3 border-l border-outline-variant/30 space-y-0.5">
                        {[
                          { id: "usuarios", label: "Usuarios Registrados" },
                          { id: "organizaciones", label: "Organizaciones Suscriptoras" },
                        ].map((sub) => {
                          const activeSec =
                            new URLSearchParams(location.search).get("seccion") || "usuarios"
                          const isSubActive =
                            location.pathname.startsWith("/app/usuarios") && activeSec === sub.id
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => navigate(`/app/usuarios?seccion=${sub.id}`)}
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
                ) : (
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
                          <span className="text-[13px] flex-1 truncate">Usuarios y Equipo</span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}

              {user?.rol?.codigo === "PLATFORM_ADMIN" && (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (collapsed) {
                        navigate("/app/roles?seccion=roles")
                      } else {
                        setRolesOpen(!rolesOpen)
                        if (!location.pathname.startsWith("/app/roles")) {
                          navigate("/app/roles?seccion=roles")
                        }
                      }
                    }}
                    className={`w-full group relative flex items-center ${collapsed ? "justify-center h-10 w-10 mx-auto" : "h-10 px-3"} rounded-lg transition-all duration-200 cursor-pointer ${
                      location.pathname.startsWith("/app/roles")
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                    }`}
                  >
                    {location.pathname.startsWith("/app/roles") && (
                      <div
                        className={`absolute left-0 w-[4px] ${collapsed ? "h-10" : "h-6"} rounded-r bg-primary`}
                      />
                    )}
                    <ShieldCheck className={collapsed ? "w-5 h-5" : "mr-3 w-5 h-5 shrink-0"} />
                    {!collapsed && (
                      <>
                        <span className="text-[13px] flex-1 text-left truncate">
                          Roles y Planes
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            rolesOpen ? "rotate-180" : ""
                          }`}
                        />
                      </>
                    )}
                  </button>

                  {!collapsed && rolesOpen && (
                    <div className="ml-5 pl-3 border-l border-outline-variant/30 space-y-0.5">
                      {[
                        { id: "roles", label: "Roles y Autorizaciones" },
                        { id: "planes", label: "Planes de Servicio" },
                      ].map((sub) => {
                        const activeSec =
                          new URLSearchParams(location.search).get("seccion") || "roles"
                        const isSubActive =
                          location.pathname.startsWith("/app/roles") && activeSec === sub.id
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => navigate(`/app/roles?seccion=${sub.id}`)}
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
