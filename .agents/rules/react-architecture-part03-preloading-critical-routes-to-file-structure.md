### Preloading Critical Routes

```typescript
const DashboardPage = lazy(() => import('./pages/Dashboard.js'));

function NavLink() {
    const preload = () => import('./pages/Dashboard.js');
    return <Link to="/dashboard" onMouseEnter={preload} onFocus={preload}>Dashboard</Link>;
}
```




### Memoization Guidelines (React 19+)

```tsx
// React 19 Compiler handles most memoization automatically.
// Manual memo still useful for:

// 1. Expensive computations
const sortedItems = useMemo(() => items.sort((a, b) => a.name.localeCompare(b.name)), [items]);

// 2. Stable callbacks for heavy child components
const handleSubmit = useCallback((data: FormData) => submitForm(data), [submitForm]);

// 3. Preventing re-renders of heavy trees
const MemoizedChart = React.memo(({ data }: { data: DataPoint[] }) => <HeavyChartLibrary data={data} />);

// ❌ DON'T memo trivial operations
```




### Avoid Barrel Files

```
// ❌ BAD — src/components/index.ts re-exports force Vite to process everything
export { Button } from './Button';
export { DataTable } from './DataTable';  // Heavy, loaded even if unused

// ✅ GOOD — direct imports
import { Button } from '@/presentation/components/Button';
```




### List Virtualization

```tsx
// For lists > 100 items — npm i @tanstack/react-virtual
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: { items: Item[] }) {
    const parentRef = useRef<HTMLDivElement>(null);
    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 60,
    });

    return (
        <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
            <div style={{ height: virtualizer.getTotalSize() }}>
                {virtualizer.getVirtualItems().map(row => (
                    <div key={row.key} style={{
                        position: 'absolute', top: row.start,
                        height: row.size, width: '100%'
                    }}>
                        <ItemRow item={items[row.index]} />
                    </div>
                ))}
            </div>
        </div>
    );
}
```

---




## 11. Accessibility (a11y)




### Semantic HTML First

```tsx
// ❌ BAD
<div onClick={handleClick} className="button-style">Submit</div>

// ✅ GOOD
<button onClick={handleClick} type="submit">Submit</button>
<nav aria-label="Main navigation"><a href="/">Home</a></nav>
```




### Interactive Elements

```tsx
// Icon-only button — needs aria-label
<button onClick={onClose} aria-label="Close dialog"><X size={20} /></button>

// Toggle — sync aria-expanded with state
<button onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="menu">Menu</button>
<div id="menu" role="menu" hidden={!open}>{/* items */}</div>
```




### Focus Management (Modals)

```tsx
function Modal({ isOpen, onClose, children }: ModalProps) {
    const closeRef = useRef<HTMLButtonElement>(null);
    const triggerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (isOpen) {
            triggerRef.current = document.activeElement as HTMLElement;
            closeRef.current?.focus();
        } else {
            triggerRef.current?.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;
    return (
        <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <h2 id="modal-title">Dialog Title</h2>
            {children}
            <button ref={closeRef} onClick={onClose}>Close</button>
        </div>
    );
}
```




### Skip Navigation + Live Regions

```tsx
// Skip nav — first element in body
<a href="#main-content" className="sr-only focus:not-sr-only">Skip to main content</a>

<main id="main-content" tabIndex={-1}>{/* content */}</main>

// Live region — screen readers announce dynamically
<div aria-live="polite" role="status">{notification?.message}</div>
<div aria-live="assertive" role="alert">{error && <p>{error}</p>}</div>
```




### Focus Indicators

```css
*:focus-visible {
    outline: 2px solid #6D28D9;
    outline-offset: 2px;
    border-radius: 4px;
}
*:focus:not(:focus-visible) {
    outline: none;
}
```




### a11y Checklist (Per Component)

```
[ ] Uses semantic HTML elements
[ ] All images have alt text (decorative: alt="")
[ ] All form inputs have associated <label>
[ ] Icon-only buttons have aria-label
[ ] Color is not the only state indicator
[ ] Contrast ratio ≥ 4.5:1 (normal text), ≥ 3:1 (large text)
[ ] Fully keyboard-operable
[ ] Visible focus indicator
[ ] Dynamic content uses aria-live regions
[ ] Modals trap focus and restore on close
```

---




## 12. Testing Strategy




### Setup

```bash
npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom supertest @types/supertest
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.test.{ts,tsx}', 'api/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
        },
    },
});
```

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
```




### Unit Test — React Component

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary.js';

const ThrowError = () => { throw new Error('boom'); };

describe('ErrorBoundary', () => {
    it('renders children when no error', () => {
        render(<ErrorBoundary><div>Content</div></ErrorBoundary>);
        expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders fallback on error', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        render(<ErrorBoundary><ThrowError /></ErrorBoundary>);
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
});
```




### Test File Convention

```
src/data/repositories/__tests__/EntityRepository.test.ts
src/services/__tests__/EmailService.test.ts
src/presentation/components/__tests__/ErrorBoundary.test.tsx
api/__tests__/entities.test.ts
```




### Testing Priority

| Priority | Target | Type |
|---|---|---|
| 🔴 Critical | Auth middleware + JWT | Unit |
| 🔴 Critical | API handlers (create, update) | Integration |
| 🟡 High | Repositories | Unit |
| 🟡 High | Zod schemas | Unit |
| 🟢 Medium | React data hooks | Unit |
| 🟢 Medium | Error boundaries | Unit |
| 🔵 Low | UI components | Unit |
| 🔵 Low | Full user flows | E2E |

---




## 13. Git Workflow & Conventions




### Branch Strategy

```
main                    # Production — always deployable
├── feature/xxx         # feature/add-payment-plans
├── fix/xxx             # fix/login-token-expiry
├── chore/xxx           # chore/update-dependencies
└── release/x.y.z       # Release prep (optional)
```




### Commit Messages (Conventional Commits)

```
feat: add payment gateway integration
fix: prevent duplicate enrollment submissions
chore: update react to 19.x
docs: add architecture reference guide
refactor: extract email templates to separate module
test: add unit tests for EntityRepository
```




### .gitignore

```gitignore
node_modules/
dist/
.env
.env.local
.vscode/
.idea/
.DS_Store
Thumbs.db
*.log
.vercel/
coverage/
```




### Pre-Commit Hooks

```bash
npm i -D husky lint-staged
npx husky init
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

---




## 14. Linting & Formatting




### ESLint (Flat Config — v9+)

```bash
npm i -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks
```

```typescript
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        plugins: { 'react-hooks': reactHooks },
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'prefer-const': 'error',
        },
    },
    { ignores: ['dist/', 'node_modules/', '*.config.*'] }
);
```




### Prettier

```json
// .prettierrc
{
    "semi": true,
    "singleQuote": true,
    "trailingComma": "es5",
    "tabWidth": 4,
    "printWidth": 100,
    "bracketSpacing": true,
    "arrowParens": "always"
}
```

---




## 15. Dependency Audit & Maintenance

```bash
npm audit                # Check vulnerabilities
npm audit fix            # Auto-fix
npm outdated             # Check for updates
npm update               # Update compatible versions
npm ci                   # CI/CD — exact versions from lockfile
```




### Dependency Categories

| Category | `dependencies` | `devDependencies` |
|---|---|---|
| Runtime (React, Browser APIs) | ✅ | ❌ |
| Types (@types/*) | ❌ | ✅ |
| Build tools (Vite, TSC) | ❌ | ✅ |
| Test frameworks | ❌ | ✅ |
| Linters & formatters | ❌ | ✅ |




### Quarterly Security Checklist

```
[ ] npm audit — fix all high/critical
[ ] npm outdated — update patch/minor
[ ] Review CHANGELOG for major updates
[ ] Verify no secrets in VITE_ env vars
[ ] Rotate JWT_SECRET and API credentials
[ ] Review CORS origins match production domains
[ ] Confirm all endpoints have auth + rate limiting
```

---




## 16. Internationalization (i18n)




### Setup

```bash
npm i i18next react-i18next i18next-http-backend i18next-browser-languagedetector
```




### File Structure

```
public/locales/
├── en/
│   ├── common.json       # Shared (nav, buttons, errors)
│   ├── auth.json
│   └── dashboard.json
└── es/
    ├── common.json
    ├── auth.json
    └── dashboard.json
```
