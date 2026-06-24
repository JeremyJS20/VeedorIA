import { Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation('landing')

  const toggleLanguage = () => {
    const newLang = i18n.language === 'es' ? 'en' : 'es'
    i18n.changeLanguage(newLang)
  }

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors group cursor-pointer"
      style={{
        background: 'var(--surface-inset)',
        borderColor: 'var(--outline-variant)',
      }}
      aria-label={i18n.language === 'es' ? t('language_switcher.switch_en') : t('language_switcher.switch_es')}
    >
      <Globe
        size={14}
        className="group-hover:opacity-100 transition-opacity"
        style={{ opacity: 0.6, color: 'var(--primary)' }}
      />
      <span
        className="font-bold uppercase tracking-widest"
        style={{ fontSize: '0.75rem', color: 'var(--on-surface)' }}
      >
        {i18n.language === 'es' ? 'ES' : 'EN'}
      </span>
    </button>
  )
}
