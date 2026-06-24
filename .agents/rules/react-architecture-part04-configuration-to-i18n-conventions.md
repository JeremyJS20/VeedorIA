### Configuration

```typescript
// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n.use(HttpBackend).use(LanguageDetector).use(initReactI18next).init({
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    ns: ['common', 'landing', 'dashboard', 'auth'],
    defaultNS: 'common',
    backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    preload: ['es', 'en'],
});

export default i18n;
```




### TypeScript Key Safety

```typescript
// src/i18next.d.ts
import 'i18next';
import common from '../public/locales/en/common.json';

declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: 'common';
        resources: { common: typeof common };
    }
}
// t('nav.typo') → TypeScript error
```




### Usage

```tsx
import { useTranslation } from 'react-i18next';

function Navbar() {
    const { t } = useTranslation();
    return <nav><a href="/">{t('nav.home')}</a></nav>;
}

// Feature namespace (lazy loaded)
function Dashboard() {
    const { t } = useTranslation(['dashboard', 'common']);
    return <h1>{t('dashboard:title')}</h1>;
}
```




### Language Switcher

```tsx
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es');
    };

    return (
        <button onClick={toggleLanguage} aria-label={i18n.language === 'es' ? 'Switch to English' : 'Cambiar a Español'}>
            <Globe size={14} />
            <span>{i18n.language === 'es' ? 'ES' : 'EN'}</span>
        </button>
    );
}
```




### Locale-Aware Formatters

```typescript
// src/presentation/hooks/useFormatters.ts
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

export function useFormatters() {
    const { i18n } = useTranslation();
    const locale = i18n.language;

    return useMemo(() => ({
        date: (d: Date | string, opts?: Intl.DateTimeFormatOptions) =>
            new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric', ...opts }).format(new Date(d)),
        dateShort: (d: Date | string) =>
            new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(d)),
        number: (n: number, opts?: Intl.NumberFormatOptions) =>
            new Intl.NumberFormat(locale, opts).format(n),
        currency: (amount: number, currency = 'USD') =>
            new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount),
        percent: (n: number) =>
            new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(n),
    }), [locale]);
}
```




### i18n Conventions

| Rule | Details |
|---|---|
| Key naming | Dot-notation: `section.subsection.key` |
| Namespaces | One per feature (`common`, `landing`, `dashboard`, `auth`) |
| Fallback | `fallbackLng: 'es'` |
| Source of truth | Spanish (`es/`) — all locales mirror its structure |
| Interpolation | `{{variable}}` — never concatenate |
| Plurals | `_one`, `_other` suffixes |
| Dates/Numbers | Always `Intl` formatters |
| No hardcoded text | Every user-facing string through `t()` |

---
