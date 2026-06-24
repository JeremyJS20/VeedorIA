import { Chip } from '@heroui/react'
import { type ReactNode } from 'react'

interface BadgeProps {
  variant?: 'primary' | 'error' | 'success'
  className?: string
  children: ReactNode
}

export default function Badge({
  variant = 'primary',
  className = '',
  children,
}: BadgeProps) {
  const classes = ['badge', `badge-${variant}`, className]
    .filter(Boolean)
    .join(' ')

  return <Chip className={classes}>{children}</Chip>
}
