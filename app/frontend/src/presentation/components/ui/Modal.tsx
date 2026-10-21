import { useEffect, type ReactNode } from "react"
import { X } from "lucide-react"

const SIZE_CLASSES = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
} as const

export type ModalSize = keyof typeof SIZE_CLASSES

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: ModalSize
  /** Permite bloquear el cierre por clic en el fondo (p. ej. mientras guarda). */
  closeOnBackdrop?: boolean
  className?: string
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  closeOnBackdrop = true,
  className = "",
}: ModalProps) {
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
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/45"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        className={`relative w-full ${SIZE_CLASSES[size]} rounded-2xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 shadow-2xl ${className}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
          <h3 className="text-sm font-bold text-on-surface">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-outline-variant/20">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
