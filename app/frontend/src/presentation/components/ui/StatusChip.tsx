import type { LucideIcon } from "lucide-react"

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral"

const TONE_STYLES: Record<StatusTone, string> = {
  success:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  danger: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
  info: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  neutral:
    "bg-surface-container-high text-on-surface-variant border-outline-variant/35",
}

const DOT_STYLES: Record<StatusTone, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-sky-500",
  neutral: "bg-outline",
}

interface StatusChipProps {
  tone: StatusTone
  /** Texto visible: obligatorio para no depender solo del color (WCAG 1.4.1). */
  label: string
  /** Icono opcional; si se omite se dibuja un punto de color. */
  icon?: LucideIcon
  iconClassName?: string
  className?: string
}

export default function StatusChip({
  tone,
  label,
  icon: Icon,
  iconClassName = "w-3 h-3",
  className = "",
}: StatusChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${TONE_STYLES[tone]} ${className}`}
    >
      {Icon ? (
        <Icon className={`${iconClassName} shrink-0`} />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_STYLES[tone]}`} />
      )}
      {label}
    </span>
  )
}
