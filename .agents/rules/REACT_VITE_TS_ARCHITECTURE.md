# React + Vite + TypeScript Architecture

## 1. Philosophy

| Principle | What it means |
|---|---|
| **Clean Architecture** | Strict separation into Domain → Application/Services → Infrastructure → Presentation. Inner layers never depend on outer layers. |
| **Component Driven** | Strict separation of concerns via structured folder architecture. |
| **Zero Trust / Immutability** | Strict input validation at the edge (two-pass Zod validation). Append-only logic for critical ledgers. |
| **Client-Side Rendering** | Standalone React Single Page Application (SPA) with Vite. |
| **Convention over Configuration** | File placement determines behavior (Vercel routing, layer boundaries, migration order). |

---


## 2. Technology Stack


### Core

| Role | Technology | Why |
|---|---|---|
| Language | **TypeScript** | Strict type safety for components and data models |
| Frontend | **React 19** | Component model, concurrent features, ecosystem |
| Bundler | **Vite** | Fast HMR, native ESM, simple config |
| UI Components | **HeroUI** (`@heroui/react` ^3.2.1) | Accessible, ARIA-compliant primitives; project wrappers supply all visual styling via CSS |
| Styling | **TailwindCSS 4** (Vite plugin) | Utility-first, no CSS context switching |
| Routing | **React Router DOM 7** | Declarative, nested routes, data loading |
| Icons | **Lucide React** | Consistent, tree-shakeable icon set |


### HeroUI Integration

**Theme System:**
- `useTheme()` is imported from `@heroui/react` — **no custom ThemeProvider**
- HeroUI manages `data-theme` + class on `<html>`, system preference detection, and localStorage persistence automatically
- Components use `const { resolvedTheme, setTheme } = useTheme()` — `resolvedTheme` is always `'light'|'dark'` (never `'system'`)
- ThemeToggler: `setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')`
- CSS: All theme tokens defined in `:root` / `[data-theme="dark"]` blocks — HeroUI syncs the attribute

**Wrapper Pattern:**
HeroUI provides **behavior + accessibility** (onPress, isPending, ARIA, keyboard). Project wrapper components supply **all visual styling** via CSS classes:
- `ui/Button.tsx` → wraps HeroUI `<Button>`, applies `.btn btn-primary|secondary|ghost` CSS classes
- `ui/GlassCard.tsx` → wraps HeroUI `<Card>`, applies `.glass-card` CSS classes
- `ui/Badge.tsx` → wraps HeroUI `<Chip>`, applies `.badge` CSS classes
- `ui/InsetPanel.tsx` → plain `<div>` (no HeroUI behavior needed)

**CSS Layer Priority:** Unlayered CSS (our `.btn`, `.glass-card`, `.badge`) > `@layer utilities` > `@layer components` (HeroUI) > `@layer base` > `@layer theme`

**CSS Import Order:**
```css
@import "tailwindcss";
@import "@heroui/styles";   /* HeroUI base layers (focus rings, keyframes) */
/* then our @theme, :root, [data-theme="dark"], component classes */
```

### DevOps

| Role | Technology | Why |
|---|---|---|
| TS Execution | **tsx** | Run TS directly without compilation step |
| Deployment | **Vercel / Netlify / CDN** | Static SPA deployment |

---


## 3. Project Structure

```text
frontend-app/
│
├── public/                   #   Static assets and locales
├── src/
│   ├── Domain/               #   Frontend representations of business entities
│   ├── Infrastructure/       #   HTTP Clients, integrations
│   ├── Presentation/         #   React views (Pages, Components, Context, Hooks)
│   ├── Validation/           #   Client-side validation
│   └── main.tsx              #   React DOM entry point
│
├── .env                      # Local environment (gitignored)
├── .env.example              # Documented env template
├── package.json              # Frontend dependencies and scripts
├── tsconfig.json             # TypeScript config
└── vite.config.ts            # Vite bundler config
```

---


## 4. Configuration Files


### 5.1 `package.json` (scripts)

```json
{
  "name": "my-app",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src/ api/",
    "lint:fix": "eslint src/ api/ --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx}\" \"api/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx}\" \"api/**/*.ts\""
  }
}
```


### 5.2 `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
    plugins: [react(), tailwindcss()],

    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },

    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },

    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom'],
                    'router': ['react-router-dom'],
                },
            },
        },
        target: 'esnext',
        minify: 'esbuild',
        cssMinify: true,
        sourcemap: mode === 'development',
        chunkSizeWarningLimit: 500,
    },

    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom'],
    },
}));
```


### 5.3 `vercel.json`

```json
{
  "version": 2,
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```


### 5.4 `tsconfig.app.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```


### 5.5 `.env.example`

```bash
# ── Server ──
PORT=3001
NODE_ENV=development

# ── Frontend ──
VITE_APP_URL=http://localhost:5173

# ── Auth ──
JWT_SECRET=change_me_in_production_min_32_chars


# ── File Storage ──
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_token

# ── External Services (add as needed) ──
# MAIL_AUTH_URL=
# MAIL_SEND_URL=
# MAIL_USER=
# MAIL_PASS=
```

---


## 5. React Frontend


### 12.1 State Delegation
Global state is managed via specialized React Contexts (e.g., `AuthContext`, `TransactionContext`) that wrap the application. This prevents prop-drilling while keeping state strongly typed, avoiding bloated Redux stores for simple global flags.


### 12.2 Structural UI Layering (HeroUI Wrappers + CSS)
Components use **project-specific wrapper components** that wrap HeroUI primitives. HeroUI provides behavior/accessibility (onPress, isPending, ARIA, keyboard); all visual styling comes from project CSS classes (`.btn`, `.glass-card`, `.badge`, `.inset-panel`).

The visual aesthetic enforces **dual-theme glassmorphism**: glass surfaces (`backdrop-filter: blur(16px)`) in both modes, with darker glass `rgba(17,19,25,0.7)` in dark mode and lighter glass `rgba(255,255,255,0.7)` in light mode. Solid inset panels (`.inset-panel`) use `--surface-container` background with `--outline-variant` borders — no backdrop blur. Depth is created through glass opacity layers and glow drop shadows, not tonal surface color shifts.

**Available Wrappers:**
- `Button.tsx` — wraps HeroUI Button, exposes `primary|secondary|ghost` variants
- `GlassCard.tsx` — wraps HeroUI Card with glass styling
- `Badge.tsx` — wraps HeroUI Chip, exposes `primary|error|success` variants
- `InsetPanel.tsx` — plain `<div>` for solid surface cards

### 12.3 Entry Point

```tsx
// src/main.tsx
import './i18n.js';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '@/presentation/components/ErrorBoundary.js';
import App from '@/presentation/App.js';
import './index.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ErrorBoundary>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </ErrorBoundary>
    </StrictMode>
);
```


### App with Lazy Routes

```tsx
// src/presentation/App.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/presentation/hooks/useAuth.js';

const HomePage = lazy(() => import('./pages/HomePage.js'));
const LoginPage = lazy(() => import('./pages/LoginPage.js'));
const Dashboard = lazy(() => import('./pages/Dashboard.js'));
const Settings = lazy(() => import('./pages/Settings.js'));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
    return children;
};

export default function App() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-[50vh]">Loading...</div>}>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
}
```


### Data Fetching Hooks

```typescript
// src/presentation/hooks/useFetch.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth.js';

export function useFetch<T>(url: string, options: { authenticated?: boolean } = {}) {
    const { token } = useAuth();
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (signal?: AbortSignal) => {
        setLoading(true); setError(null);
        try {
            const headers: Record<string, string> = {};
            if (options.authenticated && token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(url, { signal, headers });
            if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.error || `HTTP ${res.status}`); }
            const json = await res.json();
            if (!signal?.aborted) setData(json.data ?? json);
        } catch (err: any) {
            if (err.name !== 'AbortError') setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [url, token, options.authenticated]);

    useEffect(() => {
        const controller = new AbortController();
        fetchData(controller.signal);
        return () => controller.abort();
    }, [fetchData]);

    return { data, loading, error, refetch: () => fetchData() };
}
```

```typescript
// src/presentation/hooks/useMutation.ts
import { useState } from 'react';
import { useAuth } from './useAuth.js';

export function useMutation<TIn, TOut>(url: string, method: 'POST' | 'PUT' | 'DELETE' = 'POST') {
    const { token } = useAuth();
    const [data, setData] = useState<TOut | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutate = async (body?: TIn): Promise<TOut | null> => {
        setLoading(true); setError(null);
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                ...(body ? { body: JSON.stringify(body) } : {}),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
            const result = json.data ?? json;
            setData(result);
            return result;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, error, mutate, reset: () => { setData(null); setError(null); } };
}
```

---


## 6. Vite Build Optimization


### Bundle Analysis

```bash
# Visualize bundle composition
npm i -D vite-bundle-analyzer

# Add to vite.config.ts plugins (dev only):
# import { analyzer } from 'vite-bundle-analyzer';
# plugins: [react(), tailwindcss(), analyzer()],

# Or analyze after build:
npx vite-bundle-analyzer
```


### Environment Variable Rules

| Prefix | Exposed To | Example |
|---|---|---|
| `VITE_` | Client bundle (visible in browser) | `VITE_APP_URL`, `VITE_FEATURE_FLAG` |
| No prefix | Server only (never in bundle) | `JWT_SECRET`, `DATABASE_URL` |

```
⚠️ NEVER put secrets in VITE_ variables — they are embedded in the JS bundle
   and visible in browser dev tools.
```


### Image & Asset Optimization

```bash
npm i -D vite-plugin-imagemin
```

```typescript
// vite.config.ts
import imagemin from 'vite-plugin-imagemin';

plugins: [
    react(),
    tailwindcss(),
    imagemin({
        gifsicle: { optimizationLevel: 3 },
        mozjpeg: { quality: 80 },
        pngquant: { quality: [0.65, 0.9] },
        svgo: { plugins: [{ removeViewBox: false }] },
    }),
],
```

---


## 7. Auth Context

```tsx
// src/presentation/context/AuthContext.tsx
import { createContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: string;
    email: string;
    role: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>({
    user: null, token: null,
    login: () => {}, logout: () => {},
    isAuthenticated: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);

    // Restore from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('token');
        if (stored) {
            try {
                const payload = JSON.parse(atob(stored.split('.')[1]));
                if (payload.exp * 1000 >= Date.now()) {
                    setToken(stored);
                    setUser(JSON.parse(localStorage.getItem('user')!));
                } else {
                    logout();
                }
            } catch { logout(); }
        }
    }, []);

    // Periodic expiry check
    useEffect(() => {
        const interval = setInterval(() => {
            const t = localStorage.getItem('token');
            if (t) {
                try {
                    const payload = JSON.parse(atob(t.split('.')[1]));
                    if (payload.exp * 1000 < Date.now()) logout();
                } catch { logout(); }
            }
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const login = (newToken: string, newUser: User) => {
        setToken(newToken); setUser(newUser);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    const logout = () => {
        setToken(null); setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};
```

```typescript
// src/presentation/hooks/useAuth.ts
import { useContext } from 'react';
import { AuthContext } from '@/presentation/context/AuthContext.js';

export function useAuth() {
    return useContext(AuthContext);
}
```

---


## 8. React Error Boundary

```tsx
// src/presentation/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', minHeight: '50vh', padding: '2rem',
                    textAlign: 'center'
                }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                        Something went wrong
                    </h2>
                    <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                        An unexpected error occurred. Please reload the page.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '0.75rem 1.5rem', borderRadius: '0.5rem',
                            backgroundColor: '#6D28D9', color: 'white',
                            border: 'none', cursor: 'pointer', fontWeight: 600
                        }}
                    >
                        Reload Page
                    </button>
                    {import.meta.env.DEV && this.state.error && (
                        <pre style={{
                            marginTop: '2rem', padding: '1rem', background: '#fee2e2',
                            borderRadius: '0.5rem', fontSize: '0.75rem', textAlign: 'left',
                            maxWidth: '100%', overflow: 'auto'
                        }}>
                            {this.state.error.message}{'\n'}{this.state.error.stack}
                        </pre>
                    )}
                </div>
            );
        }
        return this.props.children;
    }
}
```

---


## 9. TypeScript Patterns


### Path Aliases (`@/` Imports)

```typescript
// ❌ BAD
import { User } from '../../../domain/types';

// ✅ GOOD
import { User } from '@/domain/types';
```

Setup: `tsconfig.app.json` → `"paths": { "@/*": ["src/*"] }` + `vite.config.ts` → `alias: { '@': resolve(__dirname, 'src') }`


### Discriminated Unions

```typescript
type RequestState<T> =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: T }
    | { status: 'error'; error: string };

function renderState<T>(state: RequestState<T>) {
    switch (state.status) {
        case 'idle': return null;
        case 'loading': return <Spinner />;
        case 'success': return <DataView data={state.data} />;
        case 'error': return <ErrorMessage message={state.error} />;
    }
}
```


### Branded Types

```typescript
type Brand<T, B> = T & { __brand: B };
type UserId = Brand<string, 'UserId'>;
type ProductId = Brand<string, 'ProductId'>;

function getUser(id: UserId) { /* ... */ }
const userId = 'abc' as UserId;
const productId = 'xyz' as ProductId;
getUser(userId);      // ✅
getUser(productId);   // ❌ Type error
```


### Utility Types

```typescript
interface User {
    id: string; email: string; name: string;
    role: 'ADMIN' | 'USER'; createdAt: Date;
}

type CreateUserPayload = Omit<User, 'id' | 'createdAt'>;
type UpdateUserPayload = Partial<Pick<User, 'name' | 'role'>>;
type UserSummary = Pick<User, 'id' | 'name' | 'email'>;
type ReadonlyUser = Readonly<User>;

const DEFAULT_USER = {
    role: 'USER' as const, name: '', email: '',
} satisfies Partial<User>;
```


### Env Type Safety

```typescript
// src/env.d.ts
/// <reference types="vite/client" />
interface ImportMetaEnv {
    readonly VITE_APP_URL: string;
    readonly VITE_API_BASE_URL?: string;
}
interface ImportMeta {
    readonly env: ImportMetaEnv;
}
```

---


## 10. React Performance


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


### Configuration

```typescript
// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n.use(HttpBackend).use(LanguageDetector).use(initReactI18next).init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'es'],
    ns: ['common'],
    defaultNS: 'common',
    backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
    interpolation: { escapeValue: false },
    react: { useSuspense: true },
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

const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇩🇴' },
] as const;

export function LanguageSwitcher() {
    const { i18n } = useTranslation();
    return (
        <div role="radiogroup" aria-label="Language">
            {LANGUAGES.map(l => (
                <button key={l.code} onClick={() => i18n.changeLanguage(l.code)}
                    aria-pressed={i18n.language === l.code}>
                    {l.flag} {l.label}
                </button>
            ))}
        </div>
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
| Namespaces | One per feature (`common`, `auth`, `dashboard`) |
| Fallback | Always `fallbackLng: 'en'` |
| Source of truth | English (`en/`) — all locales mirror its structure |
| Interpolation | `{{variable}}` — never concatenate |
| Plurals | `_one`, `_other` suffixes |
| Dates/Numbers | Always `Intl` formatters |
| No hardcoded text | Every user-facing string through `t()` |

---


