import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import SectionContainer from './SectionContainer'
import Button from './ui/Button'
import { useTheme } from '@heroui/react'

const plans = ['pyme', 'corporate', 'audit'] as const

export default function PricingSection() {
  const { t } = useTranslation('landing')
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
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
      className={`scroll-reveal ${visible ? 'visible' : ''} py-xl px-margin-desktop`}
    >
      <SectionContainer>
        <div className="text-center mb-xl">
          <h2 className="font-headline-lg text-headline-lg mb-xs text-fg">
            {t('pricing.title')}
          </h2>
          <p className="text-fg-secondary max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter max-w-6xl mx-auto">
          {plans.map((planKey) => {
            const plan = t(`pricing.${planKey}`, { returnObjects: true }) as
              | { name: string; price: string; period: string; badge?: string; from?: string; features: string[]; cta: string }
              | string
            if (typeof plan === 'string') return null
            const isHighlighted = planKey === 'corporate'

            return (
              <div
                key={planKey}
                className={`glass p-lg rounded-3xl flex flex-col h-full ${
                  isHighlighted
                    ? 'border-2 border-accent shadow-2xl relative scale-105 z-10 glass-glow'
                    : isDark
                      ? 'border border-white/5'
                      : 'border border-outline-variant/30 shadow-md'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-fg-on-accent px-md py-1 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}
                <div className="mb-lg">
                  <p className="text-sm font-bold text-accent uppercase mb-xs tracking-widest">
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-xs">
                    {plan.from && (
                      <span className="text-xs text-fg-secondary">{plan.from}</span>
                    )}
                    <span className="font-data-lg text-4xl text-fg">
                      {plan.price}
                    </span>
                    <span className="text-fg-secondary">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-sm flex-1 mb-xl">
                  {plan.features?.map((feat: string, fi: number) => (
                    <li key={fi} className="flex items-center gap-sm text-sm text-on-surface">
                      <Check size={18} className="text-accent shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                {isHighlighted ? (
                  <Button variant="primary" fullWidth>
                    {plan.cta}
                  </Button>
                ) : planKey === 'audit' ? (
                  <Button variant="ghost" fullWidth>
                    {plan.cta}
                  </Button>
                ) : (
                  <Button variant="secondary" fullWidth>
                    {plan.cta}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
        <p className="text-center mt-lg text-fg-secondary text-xs font-medium">
          {t('pricing.free_note')} <span className="text-primary font-bold">{t('pricing.free_note_highlight')}</span>.
        </p>
      </SectionContainer>
    </section>
  )
}
