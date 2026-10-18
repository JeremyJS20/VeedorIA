import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import { useTheme } from "@heroui/react"
import {
  LayoutDashboard,
  FolderTree,
  Bell,
  Lock,
  Share2,
  Brain,
  UserPlus,
  Terminal,
  HelpCircle,
  Search,
  MoreVertical,
  LogOut,
  Sun,
  Settings,
  Globe,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"
import Logo from "../components/Logo"
import isotipoLight from "../../assets/veedoria_isotipo_light.webp"
import isotipoDark from "../../assets/veedoria_isotipo_dark.webp"

const auditorNav = [
  { to: "/app/overview", label: "overview", icon: LayoutDashboard },
  { to: "/app/processes", label: "processes", icon: FolderTree },
  { to: "/app/bandeja", label: "alert_tray", icon: Bell, badge: true },
]

const lockedItems = [
  { label: "collusion_network", icon: Share2 },
  { label: "ai_config", icon: Brain },
]

const adminNav = [
  { label: "user_management", icon: UserPlus },
  { label: "system_logs", icon: Terminal },
  { label: "support", icon: HelpCircle },
]

const b2bNav: { label: string; icon: typeof FolderTree; locked?: boolean }[] = [
  { label: "my_bids", icon: FolderTree },
  { label: "price_analytics", icon: LayoutDashboard, locked: true },
  { label: "opportunities", icon: Bell },
]

type Role = "auditor" | "admin" | "supplier"

const roleLabels: Record<Role, string> = {
  auditor: "Auditor",
  admin: "Admin",
  supplier: "Proveedor",
}

const roleBadgeStyles: Record<Role, string> = {
  auditor: "bg-primary-container text-on-primary-container",
  admin: "bg-inverse-surface text-inverse-on-surface",
  supplier: "bg-secondary-container text-on-secondary-container",
}

const roleBadgeLabels: Record<Role, string> = {
  auditor: "Auditor B2G",
  admin: "Administrator",
  supplier: "Supplier B2B",
}

const SIDEBAR_EXPANDED = 260
const SIDEBAR_COLLAPSED = 80

export default function DashboardLayout() {
  const { t, i18n } = useTranslation("dashboard")
  const location = useLocation()
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const [collapsed, setCollapsed] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [activeRole, setActiveRole] = useState<Role>("auditor")
  const [isotipo, setIsotipo] = useState(isotipoLight)
  const profileRef = useRef<HTMLDivElement>(null)
  const roleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsotipo(isDark ? isotipoDark : isotipoLight)
  }, [isDark])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false)
      if (roleRef.current && !roleRef.current.contains(e.target as Node))
        setRoleOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const currentPage = auditorNav.find((item) => location.pathname.startsWith(item.to))
  const sbw = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED

  return (
    <div className="flex min-h-screen bg-background text-on-surface overflow-hidden">
      <aside
        className={`h-screen fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant/30 flex flex-col z-50 transition-all duration-300`}
        style={{ width: sbw }}
      >
        <div className={`h-16 flex items-center justify-center mb-4 relative`}>
          {collapsed ? (
            <div className="h-9">
              <img src={isotipo} alt="V" className="h-full w-auto" />
            </div>
          ) : (
            <div className="h-9">
              <Logo className="h-full" />
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface border border-outline-variant/40 rounded-md shadow-sm flex items-center justify-center hover:bg-surface-container-high transition-colors z-10"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="w-3.5 h-3.5 text-outline" />
            ) : (
              <PanelLeftClose className="w-3.5 h-3.5 text-outline" />
            )}
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto ${collapsed ? "px-2" : "px-3"} space-y-8 pb-8`}>
          {activeRole !== "supplier" && (
            <div className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[11px] font-bold text-outline uppercase tracking-widest mb-2">
                  {t("sidebar.console_auditor")}
                </p>
              )}
              {auditorNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
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
                      {isActive && !collapsed && (
                        <div className="absolute left-0 w-[4px] h-6 rounded-r bg-primary" />
                      )}
                      {isActive && collapsed && (
                        <div className="absolute left-0 w-[4px] h-10 rounded-r bg-primary" />
                      )}
                      <item.icon className={collapsed ? "w-5 h-5" : "mr-3 w-5 h-5 shrink-0"} />
                      {!collapsed && (
                        <span className="text-[13px] flex-1 truncate">{t(`sidebar.${item.label}`)}</span>
                      )}
                      {item.badge && (
                        collapsed
                          ? <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
                          : <span className="bg-error text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">12</span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
              {lockedItems.map((item) => (
                <div
                  key={item.label}
                  className={`group relative flex items-center ${collapsed ? "justify-center h-10 w-10 mx-auto" : "h-10 px-3"} rounded-lg opacity-40 cursor-not-allowed`}
                >
                  <item.icon className={collapsed ? "w-5 h-5 text-on-surface-variant" : "mr-3 w-5 h-5 shrink-0 text-on-surface-variant"} />
                  {!collapsed && (
                    <>
                      <span className="text-[13px] flex-1 truncate text-on-surface-variant">{t(`sidebar.${item.label}`)}</span>
                      <Lock className="w-4 h-4 text-on-surface-variant shrink-0" />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {(activeRole === "admin") && (
            <div className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[11px] font-bold text-outline uppercase tracking-widest mb-2">
                  {t("sidebar.administration")}
                </p>
              )}
              {adminNav.map((item) => (
                <div
                  key={item.label}
                  className={`group flex items-center ${collapsed ? "justify-center h-10 w-10 mx-auto" : "h-10 px-3"} rounded-lg transition-all duration-200 text-on-surface-variant hover:bg-surface-container-high hover:text-primary cursor-pointer`}
                >
                  <item.icon className={collapsed ? "w-5 h-5" : "mr-3 w-5 h-5 shrink-0"} />
                  {!collapsed && (
                    <span className="text-[13px] flex-1 truncate">{t(`sidebar.${item.label}`)}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeRole === "supplier" && (
            <div className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[11px] font-bold text-outline uppercase tracking-widest mb-2">
                  {t("sidebar.supplier_panel")}
                </p>
              )}
              {b2bNav.map((item) => (
                <div
                  key={item.label}
                  className={`group flex items-center ${collapsed ? "justify-center h-10 w-10 mx-auto" : "h-10 px-3"} rounded-lg transition-all duration-200 ${
                    item.locked
                      ? "opacity-40 cursor-not-allowed"
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary cursor-pointer"
                  }`}
                >
                  <item.icon className={collapsed ? "w-5 h-5" : "mr-3 w-5 h-5 shrink-0"} />
                  {!collapsed && (
                    <>
                      <span className="text-[13px] flex-1 truncate">{t(`sidebar.${item.label}`)}</span>
                      {item.locked && <Lock className="w-4 h-4 text-on-surface-variant shrink-0" />}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`${collapsed ? "p-2" : "p-4"} border-t border-outline-variant/20 bg-surface-container-low/50 relative`} ref={profileRef}>
          <button
            onClick={() => !collapsed && setProfileOpen(!profileOpen)}
            className={`w-full flex items-center ${collapsed ? "justify-center" : "gap-3"} p-2 rounded-xl transition-all hover:bg-surface-container-high active:scale-[0.98] group`}
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">CM</span>
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[13px] font-semibold text-on-surface leading-tight truncate">
                    Carlos Mendizábal
                  </p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${roleBadgeStyles[activeRole]}`}>
                    {roleBadgeLabels[activeRole]}
                  </span>
                </div>
                <MoreVertical className="w-4 h-4 text-outline group-hover:text-primary transition-colors shrink-0" />
              </>
            )}
          </button>

          {!collapsed && profileOpen && (
            <div className="absolute bottom-20 left-4 right-4 bg-surface shadow-xl rounded-xl border border-outline-variant/30 overflow-hidden py-2 z-50">
              <button
                onClick={() => i18n.changeLanguage(i18n.language === "es" ? "en" : "es")}
                className="w-full flex items-center px-4 py-2 text-[13px] text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
              >
                <Globe className="w-5 h-5 mr-3" />
                {t("header.language")}
              </button>
              <button className="w-full flex items-center px-4 py-2 text-[13px] text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors">
                <Settings className="w-5 h-5 mr-3" />
                {t("header.account_settings")}
              </button>
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="w-full flex items-center px-4 py-2 text-[13px] text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
              >
                <Sun className="w-5 h-5 mr-3" />
                {t(isDark ? "header.light_mode" : "header.dark_mode")}
              </button>
              <div className="border-t border-outline-variant/10 my-1" />
              <button className="w-full flex items-center px-4 py-2 text-[13px] text-error hover:bg-error-container/50 transition-colors">
                <LogOut className="w-5 h-5 mr-3" />
                {t("header.logout")}
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className={`flex-1 flex flex-col h-screen overflow-hidden bg-background transition-all duration-300`} style={{ marginLeft: sbw }}>
        <header className="h-16 flex items-center justify-between px-8 bg-surface/70 backdrop-blur-md z-40 border-b border-outline-variant/10">
          <nav className="flex items-center space-x-2 text-[13px] text-outline">
            <span className="hover:text-primary cursor-pointer transition-colors">
              {t("header.breadcrumb_console")}
            </span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-on-surface font-semibold">
              {currentPage ? t(`sidebar.${currentPage.label}`) : t("header.breadcrumb_overview")}
            </span>
          </nav>

          <div className="flex items-center gap-6">
            <div className="relative" ref={roleRef}>
              <div
                onClick={() => setRoleOpen(!roleOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-lg border border-outline-variant/20 cursor-pointer hover:bg-surface-container-high transition-colors"
              >
                <span className="text-[12px] font-bold text-on-surface-variant uppercase tracking-tight">
                  {t("header.simulate_role")}
                </span>
                <span className="text-[13px] font-semibold text-primary">
                  {roleLabels[activeRole]}
                </span>
                <ChevronDown className="w-4 h-4 text-outline" />
              </div>

              {roleOpen && (
                <div className="absolute right-0 top-full pt-2 w-56 z-50">
                  <div className="bg-surface border border-outline-variant/30 shadow-2xl rounded-xl py-2 overflow-hidden">
                    <button
                      onClick={() => { setActiveRole("admin"); setRoleOpen(false) }}
                      className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-primary-container/10 hover:text-primary transition-colors text-on-surface-variant"
                    >
                      {t("header.role_admin")}
                    </button>
                    <button
                      onClick={() => { setActiveRole("auditor"); setRoleOpen(false) }}
                      className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-primary-container/10 hover:text-primary transition-colors text-on-surface-variant"
                    >
                      {t("header.role_auditor")}
                    </button>
                    <div className="h-px bg-outline-variant/10 my-1" />
                    <button
                      onClick={() => { setActiveRole("supplier"); setRoleOpen(false) }}
                      className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-primary-container/10 hover:text-primary transition-colors text-on-surface-variant"
                    >
                      {t("header.role_supplier")}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
                <Search className="w-5 h-5" />
              </button>
              <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
