import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import SectionContainer from './SectionContainer'
import { useTheme } from '@heroui/react'

const metrics = [
  { value: 'RD$ 142.5B', labelKey: 'metrics.funds', isError: false },
  { value: '2,450+', labelKey: 'metrics.suppliers', isError: false },
  { value: '92.0%', labelKey: 'metrics.accuracy', isError: false },
  { value: '4,120', labelKey: 'metrics.deviations', isError: true },
]

export default function StatsSection() {
  const { t } = useTranslation('landing')
  const { resolvedTheme } = useTheme()
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      className={`py-xl px-margin-desktop transition-all duration-700 ${
        resolvedTheme === 'light'
          ? 'bg-surface-container border-y border-outline-variant/10'
          : 'bg-surface-container-lowest'
      } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <SectionContainer>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter text-center">
        {metrics.map((m) => (
          <div key={m.labelKey} className="space-y-xs">
            <p className={`font-data-lg text-display-lg ${m.isError ? 'text-error' : 'text-primary'}`}>
              {m.value}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
              {t(m.labelKey)}
            </p>
          </div>
        ))}
      </div>
      </SectionContainer>
    </section>
  )
}
