import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ChevronDown } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { NavRail } from "./NavItem"
import type { NavSubLink } from "./navModel"

interface NavAccordionProps {
  label: string
  icon: LucideIcon
  /** Ruta base; las sub-vistas se distinguen por `?seccion=`. */
  basePath: string
  defaultSection: string
  items: NavSubLink[]
  collapsed: boolean
}

/**
 * Entrada del sidebar con sub-vistas. Con la barra contraída el encabezado
 * navega directo a la sub-vista por defecto (no hay espacio para desplegar).
 */
export default function NavAccordion({
  label,
  icon: Icon,
  basePath,
  defaultSection,
  items,
  collapsed,
}: NavAccordionProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)

  const isActive = location.pathname.startsWith(basePath)
  const activeSection = new URLSearchParams(location.search).get("seccion") || defaultSection

  const goToSection = (sectionId: string) => navigate(`${basePath}?seccion=${sectionId}`)

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => {
          if (collapsed) {
            goToSection(defaultSection)
            return
          }
          setOpen((current) => !current)
          if (!isActive) goToSection(defaultSection)
        }}
        aria-expanded={!collapsed && open}
        className={`w-full group relative flex items-center ${collapsed ? "justify-center h-10 w-10 mx-auto" : "h-10 px-3"} rounded-lg transition-all duration-200 cursor-pointer ${
          isActive
            ? "bg-primary/10 text-primary font-semibold"
            : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
        }`}
      >
        {isActive && <NavRail collapsed={collapsed} />}
        <Icon className={collapsed ? "w-5 h-5" : "mr-3 w-5 h-5 shrink-0"} />
        {!collapsed && (
          <>
            <span className="text-[13px] flex-1 text-left truncate">{label}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
            />
          </>
        )}
      </button>

      {!collapsed && open && (
        <div className="ml-5 pl-3 border-l border-outline-variant/30 space-y-0.5">
          {items.map((sub) => {
            const isSubActive = isActive && activeSection === sub.id
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => goToSection(sub.id)}
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
  )
}
