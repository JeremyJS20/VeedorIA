import { NavLink } from "react-router-dom"
import type { LucideIcon } from "lucide-react"

interface NavItemProps {
  to: string
  label: string
  icon: LucideIcon
  collapsed: boolean
}

/** Barra vertical que marca el ítem activo. */
export function NavRail({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={`absolute left-0 w-[4px] ${collapsed ? "h-10" : "h-6"} rounded-r bg-primary`}
    />
  )
}

export default function NavItem({ to, label, icon: Icon, collapsed }: NavItemProps) {
  return (
    <NavLink
      to={to}
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
          {isActive && <NavRail collapsed={collapsed} />}
          <Icon className={collapsed ? "w-5 h-5" : "mr-3 w-5 h-5 shrink-0"} />
          {!collapsed && <span className="text-[13px] flex-1 truncate">{label}</span>}
        </>
      )}
    </NavLink>
  )
}
