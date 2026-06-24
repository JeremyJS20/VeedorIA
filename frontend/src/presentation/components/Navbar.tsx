import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeToggler from './ThemeToggler'
import SectionContainer from './SectionContainer'
import Button from './ui/Button'
import Logo from './Logo'

export default function Navbar() {
  const { t } = useTranslation('landing')
  const navLinks = [
    { label: t('navbar.links.citizen'), onClick: () => {} },
    { label: t('navbar.links.business'), onClick: () => {} },
    { label: t('navbar.links.institutions'), onClick: () => {} },
  ]

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-outline-variant/20 shadow-xl">
      <SectionContainer className="flex justify-between items-center py-sm">
        <Logo className="h-10" />

          <div className="hidden md:flex items-center gap-md">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={link.onClick}
                className="text-on-surface-variant text-base font-medium transition-colors hover:text-primary active:scale-95"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-sm">
            <LanguageSwitcher />
            <ThemeToggler />
            <Button variant="primary" size="sm">
              {t('navbar.login')}
            </Button>
          </div>
        </SectionContainer>
      </nav>
  )
}
