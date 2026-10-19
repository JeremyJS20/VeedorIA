import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeToggler from './ThemeToggler'
import SectionContainer from './SectionContainer'
import Button from './ui/Button'
import Logo from './Logo'

export default function Navbar() {
  const { t } = useTranslation('landing')
  const navigate = useNavigate()
  const location = useLocation()

  const handleBusinessClick = () => {
    if (location.pathname === '/') {
      const el = document.getElementById('portals-section')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    navigate('/public')
  }

  const navLinks = [
    { label: t('navbar.links.citizen'), path: '/public', onClick: () => navigate('/public') },
    { label: t('navbar.links.business'), path: '/#portals', onClick: handleBusinessClick },
    { label: t('navbar.links.institutions'), path: '/ranking', onClick: () => navigate('/ranking') },
  ]

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/85 backdrop-blur-xl border-b border-outline-variant/20 shadow-xl">
      <SectionContainer className="flex justify-between items-center py-sm">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="cursor-pointer focus:outline-none"
          aria-label="Ir al inicio de VeedorIA"
        >
          <Logo className="h-10" />
        </button>

        <div className="hidden md:flex items-center gap-md">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path || (link.path === '/public' && location.pathname === '/explore')
            return (
              <button
                key={link.label}
                type="button"
                onClick={link.onClick}
                className={`text-base font-medium transition-colors hover:text-primary active:scale-95 cursor-pointer ${
                  isActive ? 'text-primary font-bold' : 'text-on-surface-variant'
                }`}
              >
                {link.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-sm">
          <div
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400"
            title="Sincronización activa con Datos Abiertos DGCP"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sync: LIVE</span>
          </div>
          <LanguageSwitcher />
          <ThemeToggler />
          <Button variant="primary" size="sm" onClick={() => navigate('/app/bandeja')}>
            {t('navbar.login')}
          </Button>
        </div>
      </SectionContainer>
    </nav>
  )
}