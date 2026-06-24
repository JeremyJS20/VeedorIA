import { useEffect, useRef } from 'react'
import logolight from '../../assets/veedoria_logo_light.webp'
import logodark from '../../assets/veedoria_logo_dark.webp'

interface LogoProps {
  className?: string
}

export default function Logo({ className = '' }: LogoProps) {
  const lightRef = useRef<HTMLImageElement>(null)
  const darkRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const el = document.documentElement
    const update = () => {
      const isDark = el.getAttribute('data-theme') === 'dark'
      if (lightRef.current) lightRef.current.style.display = isDark ? 'none' : ''
      if (darkRef.current) darkRef.current.style.display = isDark ? '' : 'none'
    }
    update()
    const observer = new MutationObserver(update)
    observer.observe(el, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  return (
    <a href="/" className={`flex items-center ${className}`}>
      <img ref={lightRef} src={logolight} alt="VeedorIA" className="h-full w-auto" />
      <img ref={darkRef} src={logodark} alt="VeedorIA" className="h-full w-auto" style={{ display: 'none' }} />
    </a>
  )
}
