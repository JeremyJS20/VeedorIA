import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import SectionContainer from './SectionContainer'
import { useTheme } from '@heroui/react'

export default function SocialProofSection() {
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

  const logos = [
    t('social_proof.ocds'),
    t('social_proof.dgcp'),
    t('social_proof.open_contracting'),
    t('social_proof.ai_models'),
  ]

  return (
    <section
      ref={ref}
      className={`py-lg px-margin-desktop border-y transition-all duration-700 ${
        resolvedTheme === 'light'
          ? 'bg-surface-container border-outline-variant/20'
          : 'bg-surface-container-lowest border-outline-variant/10'
      } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <SectionContainer>
        <div
          className={`flex flex-wrap justify-between items-center gap-lg ${
            resolvedTheme === 'light'
              ? 'opacity-40 grayscale contrast-125'
              : 'opacity-40 grayscale'
          }`}
        >
          {logos.map((logo, i) => (
            <span
              key={i}
              className={`font-display-lg text-xl font-extrabold tracking-tighter${
                resolvedTheme === 'light' ? ' text-on-surface' : ''
              }`}
            >
              {logo}
            </span>
          ))}
        </div>
      </SectionContainer>
    </section>
  )
}
