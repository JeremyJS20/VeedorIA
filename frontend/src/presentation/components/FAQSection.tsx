import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import SectionContainer from './SectionContainer'
import { useTheme } from '@heroui/react'

const faqKeys = ['q1', 'q2', 'q3'] as const

export default function FAQSection() {
  const { t } = useTranslation('landing')
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [openIndex, setOpenIndex] = useState<number | null>(null)
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

  const faqs = faqKeys.map((k) => t(`faq.${k}`, { returnObjects: true }) as { q: string; a: string })

  return (
    <section
      ref={ref}
      className={`scroll-reveal ${visible ? 'visible' : ''} py-xl px-margin-desktop ${
        isDark ? 'bg-surface-container-low/40' : 'bg-surface-container-low'
      }`}
    >
      <SectionContainer>
        <div className="max-w-3xl mx-auto">
          <h2 className="font-headline-lg text-headline-lg mb-xl text-center text-fg">
            {t('faq.title')}
          </h2>
          <div className="space-y-md">
            {faqs.map((faq, i) => {
              const isOpen = openIndex === i
              return (
                <div
                  key={i}
                  className={`glass p-md rounded-2xl cursor-pointer group ${
                    isDark ? '' : 'hover:bg-white transition-colors border border-outline-variant/30 shadow-sm'
                  }`}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-fg">{faq.q}</h4>
                    <ChevronDown
                      size={18}
                      className={`text-primary transition-transform shrink-0 ml-3 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  <div
                    className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                    style={{ maxHeight: isOpen ? '300px' : '0px' }}
                  >
                    <p className="mt-md text-fg-secondary text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}
