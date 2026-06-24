import { Button as HeroButton, type ButtonProps as HeroButtonProps } from '@heroui/react'

interface ButtonProps extends Omit<HeroButtonProps, 'variant' | 'size'> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full-width' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <HeroButton className={classes} {...props}>
      {children}
    </HeroButton>
  )
}
