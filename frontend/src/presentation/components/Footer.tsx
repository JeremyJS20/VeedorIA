import { useTranslation } from 'react-i18next'
import SectionContainer from './SectionContainer'
import { useTheme } from '@heroui/react'
import Logo from './Logo'

const links = ['privacy', 'terms', 'methodology', 'contact'] as const

export default function Footer() {
  const { t } = useTranslation('landing')
  const { resolvedTheme } = useTheme()

  return (
    <footer
      className={`w-full ${resolvedTheme === 'light' ? 'bg-surface-container-low border-t border-outline-variant/20' : 'bg-surface-container-low/40 backdrop-blur-md border-t border-white/5'}`}
    >
      <SectionContainer className="flex flex-col md:flex-row justify-between items-center py-lg">
        <div className="flex flex-col items-center md:items-start gap-xs mb-md md:mb-0">
          <Logo className="h-8" />
          <p className={`font-body-sm text-body-sm text-on-surface-variant${resolvedTheme === 'light' ? ' opacity-80' : ' opacity-60'}`}>
            {t('footer.tagline')}
          </p>
        </div>
        <div className="flex gap-lg">
          {links.map((linkKey) => (
            <a
              key={linkKey}
              href="#"
              className="text-on-surface-variant font-body-sm hover:text-primary transition-colors"
            >
              {t(`footer.${linkKey}`)}
            </a>
          ))}
        </div>
      </SectionContainer>
    </footer>
  )
}
