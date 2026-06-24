import { type ReactNode } from 'react'

interface InsetPanelProps {
  hoverable?: boolean
  className?: string
  children: ReactNode
}

export default function InsetPanel({
  hoverable = false,
  className = '',
  children,
}: InsetPanelProps) {
  const classes = [
    'inset-panel',
    hoverable ? 'inset-panel-hoverable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <div className={classes}>{children}</div>
}
