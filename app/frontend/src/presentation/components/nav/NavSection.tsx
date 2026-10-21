import type { ReactNode } from "react"

interface NavSectionProps {
  /** Vacío = sin encabezado (entrada suelta, p. ej. Panorama Ejecutivo). */
  title: string
  collapsed: boolean
  children: ReactNode
}

/** Grupo del sidebar: encabezado en mayúsculas + sus entradas. */
export default function NavSection({ title, collapsed, children }: NavSectionProps) {
  return (
    <div className="space-y-1">
      {!collapsed && title && (
        <p className="px-3 text-[11px] font-bold text-outline uppercase tracking-widest mb-2">
          {title}
        </p>
      )}
      {children}
    </div>
  )
}
