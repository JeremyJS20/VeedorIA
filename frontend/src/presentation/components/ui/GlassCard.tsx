import { Card } from '@heroui/react'
import { type ReactNode } from 'react'

interface GlassCardProps {
  glow?: boolean
  className?: string
  children: ReactNode
}

export default function GlassCard({
  glow = false,
  className = '',
  children,
}: GlassCardProps) {
  const classes = ['glass-card', glow ? 'glass-card-glow' : '', className]
    .filter(Boolean)
    .join(' ')

  return <Card className={classes}>{children}</Card>
}
