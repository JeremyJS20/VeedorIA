import { motion } from 'framer-motion'
import { Bell, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SectionContainer from './SectionContainer'
import Button from './ui/Button'
import GlassCard from './ui/GlassCard'
import { useTheme } from '@heroui/react'

export default function HeroSection() {
  const { t } = useTranslation('landing')
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <header className="relative min-h-screen pt-xl flex items-center px-margin-desktop overflow-hidden">
      <div className={`absolute -bottom-10 -right-10 w-64 h-64 ${
        isDark ? 'bg-primary/20' : 'bg-primary/10'
      } blur-[120px] rounded-full -z-10`} />

      <SectionContainer className="w-full z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        <div className="md:col-span-7 flex flex-col justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div className="inline-flex items-center px-md py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-bold tracking-[0.2em] text-primary uppercase mb-md w-fit">
              {t('hero.badge')}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
            <h1 className={`font-display-lg text-[64px] leading-tight mb-md ${
              isDark ? 'text-gradient' : 'text-on-surface'
            }`}>
              {t('hero.title')}
            </h1>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
            <p className="text-on-surface-variant text-lg max-w-3xl mb-lg">
              {t('hero.subtitle')}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="flex flex-wrap gap-md">
            <Button variant="primary" size="lg">
              {t('hero.cta_search')}
            </Button>
            <Button variant="secondary" size="lg">
              {t('hero.cta_demo')}
            </Button>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="md:col-span-5 relative mt-lg md:mt-0">
          <GlassCard glow className={`w-full${isDark ? ' border border-white/5' : ' border border-outline-variant/20'}`}>
            <div className="flex justify-between items-center mb-md">
              <span className="text-[10px] font-bold tracking-widest text-primary uppercase">
                {t('hero.dashboard_label')}
              </span>
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 pulse-green" />
                <span className="w-2 h-2 rounded-full bg-primary/40" />
              </div>
            </div>

            <div className="mb-lg">
                <p className="text-sm font-normal text-on-surface-variant mb-xs">
                  {t('hero.dashboard_monitored')}
                </p>
              <h2 className="font-display-lg text-[40px] leading-none tracking-tight text-on-surface">
                RD$ 142.5 <span className="text-xl opacity-60">Mil Millones</span>
              </h2>
            </div>

            <div className="mb-md">
              <div className="flex justify-between text-xs mb-xs">
                <span className="text-outline uppercase">{t('hero.dashboard_transparency')}</span>
                <span className="font-bold text-primary font-mono text-sm">94.8%</span>
              </div>
              <div className="h-2 w-full rounded-full overflow-hidden bg-surface-container-highest">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: '94.8%' }} />
              </div>
            </div>

            <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-sm">
                  {t('hero.dashboard_alerts_title')}
                </p>
              <div className={`glass p-sm rounded-xl flex items-center gap-sm ${
                isDark ? 'bg-white/5' : 'bg-white/40 border border-outline-variant/20'
              } mb-xs`}>
                <div className="p-xs rounded-lg bg-primary/10 text-primary">
                  <Shield size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs truncate text-on-surface">{t('hero.alert_mopc_title')}</p>
                  <p className="text-[10px] truncate text-on-surface-variant">{t('hero.alert_mopc_desc')}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-primary font-mono text-[10px] block">RD$ 12.4M</span>
                  <span className="text-[8px] text-green-600 font-bold uppercase">{t('hero.alert_savings')}</span>
                </div>
              </div>
              <div className={`glass p-sm rounded-xl flex items-center gap-sm opacity-80${
                isDark ? '' : ' border border-outline-variant/10'
              }`}>
                <div className="p-xs rounded-xl bg-error/10 text-error">
                  <Bell size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs truncate text-on-surface">{t('hero.alert_sns_title')}</p>
                  <p className="text-[10px] truncate text-on-surface-variant">{t('hero.alert_sns_desc')}</p>
                </div>
                <span className="font-mono text-[10px] text-outline shrink-0">09:42 AM</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
      </SectionContainer>
    </header>
  )
}
