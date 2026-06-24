import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import SectionContainer from './SectionContainer'

export default function PriceCheckerSection() {
  const { t } = useTranslation('landing')
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
        <div className="glass p-xl rounded-[40px] max-w-5xl mx-auto relative overflow-hidden border border-outline-variant/20 shadow-xl">
          <div className="text-center mb-xl">
            <h2 className="font-headline-lg text-headline-lg mb-xs text-fg">
              {t('price_checker.title')}
            </h2>
            <p className="text-fg-secondary">
              {t('price_checker.subtitle')}
            </p>
            <div className="mt-lg max-w-2xl mx-auto relative">
              <input
                className="w-full rounded-xl px-lg py-3 text-sm shadow-inner bg-surface-container border border-outline-variant/30 text-fg"
                readOnly
                type="text"
                value={t('price_checker.search_placeholder')}
              />
              <Search
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-accent"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-xl items-center relative">
            <div className="space-y-lg">
              <div className="flex flex-col p-lg rounded-2xl border border-error/20 bg-error-container/20">
                <label className="text-[10px] text-error font-bold uppercase tracking-[0.2em] mb-xs">
                  {t('price_checker.gov_label')}
                </label>
                <div className="flex items-baseline gap-sm">
                  <span className="font-data-lg text-4xl text-error">RD$ 85,000</span>
                  <span className="text-fg-secondary text-sm">{t('price_checker.unit')}</span>
                </div>
              </div>
              <div
                className="flex flex-col p-lg rounded-2xl border"
                style={{
                  backgroundColor: 'var(--market-surface)',
                  borderColor: 'var(--market-border)',
                }}
              >
                <label
                  className="text-[10px] font-bold uppercase tracking-[0.2em] mb-xs"
                  style={{ color: 'var(--market-text)' }}
                >
                  {t('price_checker.market_label')}
                </label>
                <div className="flex items-baseline gap-sm">
                  <span
                    className="font-data-lg text-4xl"
                    style={{ color: 'var(--market-text)' }}
                  >
                    RD$ 41,500
                  </span>
                  <span className="text-fg-secondary text-sm">{t('price_checker.unit')}</span>
                </div>
              </div>
            </div>
            <div className="relative h-64 flex items-end gap-gutter pt-xl">
              <div className="flex-1 bg-error/10 rounded-t-2xl relative overflow-hidden" style={{ height: '100%' }}>
                <div className="absolute inset-x-0 bottom-0 bg-error rounded-t-2xl" style={{ height: '100%' }}></div>
                <div className="absolute top-4 w-full text-center font-bold text-[10px] text-white">{t('price_checker.chart_tender')}</div>
              </div>
              <div className="flex-1 bg-accent/10 rounded-t-2xl relative overflow-hidden" style={{ height: '100%' }}>
                <div className="absolute inset-x-0 bottom-0 bg-accent rounded-t-2xl" style={{ height: '48.9%' }}></div>
                <div className="absolute top-4 w-full text-center font-bold text-[10px] text-fg-on-accent">
                  {t('price_checker.chart_market')}
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="bg-error px-md py-sm rounded-full shadow-lg animate-pulse border border-white/40" style={{ boxShadow: 'var(--overprice-glow)' }}>
                  <span className="font-data-sm text-on-error uppercase">
                    {t('price_checker.overprice_badge')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}
