import { useEffect, type ReactNode } from "react"
import { X } from "lucide-react"

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  /** Clase de ancho máximo del panel; por defecto `max-w-xl`. */
  maxWidth?: string
}

export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-xl",
}: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[130] flex justify-end" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`relative h-full w-full ${maxWidth} bg-surface-container-lowest dark:bg-surface-container border-l border-outline-variant/35 shadow-2xl overflow-y-auto`}
      >
        <div className="sticky top-0 z-10 bg-surface-container-lowest dark:bg-surface-container px-5 py-4 border-b border-outline-variant/20 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-bold text-on-surface">{title}</div>
            {subtitle && (
              <div className="text-[11px] font-mono text-on-surface-variant mt-0.5">
                {subtitle}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </aside>
    </div>
  )
}
