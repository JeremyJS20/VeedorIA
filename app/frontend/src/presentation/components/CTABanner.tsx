import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import SectionContainer from './SectionContainer'
import Button from './ui/Button'
import { useTheme } from '@heroui/react'

export default function CTABanner() {
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
      className={`py-xl px-margin-desktop transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <SectionContainer>
        <div
          className={`glass p-xl rounded-[40px] text-center relative overflow-hidden flex flex-col items-center border border-primary/20${resolvedTheme === 'light' ? ' shadow-2xl' : ''}`}
        >
          <div className="absolute inset-0 bg-primary/5 -z-10" />
          <h2 className="font-display-lg text-display-lg mb-md max-w-3xl">
            {t('cta_final.title')}
          </h2>
          <p className="text-on-surface-variant mb-xl max-w-3xl">
            {t('cta_final.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-md">
            <Button variant="primary" size="lg">
              {t('cta_final.cta_primary')}
            </Button>
            <Button variant="ghost" size="lg">
              {t('cta_final.cta_secondary')}
            </Button>
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}
