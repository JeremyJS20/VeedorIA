import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@heroui/react'
import { useTranslation } from 'react-i18next'

export default function ThemeToggler() {
  const { resolvedTheme, setTheme } = useTheme()
  const { t } = useTranslation('landing')
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      className="theme-toggle"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? t('theme_toggler.light') : t('theme_toggler.dark')}
    >
      <span className="theme-toggle-icon" key={isDark ? 'dark' : 'light'}>
        {isDark ? (
          <Sun size={18} />
        ) : (
          <Moon size={18} />
        )}
      </span>
    </button>
  )
}
