import { ArrowRight, Globe, TrendingUp, Verified } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import SectionContainer from './SectionContainer'
import { useTheme } from '@heroui/react'

const portalIcons: Record<string, React.ReactNode> = {
  public: <Globe size={28} />,
  trending_up: <TrendingUp size={28} />,
  verified_user: <Verified size={28} />,
}

const portals = [
  { key: 'civic_tech', icon: 'public' },
  { key: 'b2b', icon: 'trending_up' },
  { key: 'b2g', icon: 'verified_user' },
]

export default function PortalsSection() {
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
          ? 'bg-surface-container-low'
          : 'bg-surface-container-low/40'
      } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <SectionContainer>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {portals.map((portal) => {
          const data = t(`portals.${portal.key}`, { returnObjects: true }) as {
            title: string; desc: string; cta: string; badge?: string
          }
          const isHighlighted = portal.key === 'b2b'

          return (
            <div
              key={portal.key}
              className={`glass p-lg rounded-3xl group transition-all relative overflow-hidden ${
                resolvedTheme === 'light'
                  ? `hover:bg-white ${isHighlighted ? 'border border-primary/30' : 'border border-outline-variant/30'}`
                  : `hover:bg-white/5 ${isHighlighted ? 'border border-primary/20' : 'border border-white/5'}`
              }`}
            >
              {data.badge && (
                <div className="absolute top-0 right-0 px-md py-xs bg-primary text-on-primary font-bold text-[10px] rounded-bl-xl tracking-widest">
                  {data.badge}
                </div>
              )}
              <div
                className={`mb-md p-sm w-fit rounded-2xl text-primary ${
                  resolvedTheme === 'light' ? 'bg-primary-container/50' : 'bg-primary/10'
                }`}
              >
                {portalIcons[portal.icon]}
              </div>
              <h3 className="font-headline-lg text-headline-lg mb-sm">{data.title}</h3>
              <p className="text-on-surface-variant font-body-sm text-body-sm mb-lg leading-relaxed">{data.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-primary font-bold text-sm tracking-widest">{data.cta}</span>
                <ArrowRight size={16} className="text-primary group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          )
        })}
      </div>
      </SectionContainer>
    </section>
  )
}
