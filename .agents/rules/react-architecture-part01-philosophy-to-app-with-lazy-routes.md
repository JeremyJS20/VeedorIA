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
- `useTheme()` from `@heroui/react` — **no custom ThemeProvider**
- HeroUI manages `data-theme` + class on `<html>`, system preference detection, and localStorage persistence
- Components: `const { resolvedTheme, setTheme } = useTheme()` — `resolvedTheme` is always `'light'|'dark'`
- ThemeToggler: `setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')`
- CSS tokens in `:root` / `[data-theme="dark"]` blocks — HeroUI syncs the attribute

**Wrapper Pattern:**
HeroUI provides **behavior + accessibility** (onPress, isPending, ARIA, keyboard). Project wrapper components supply **all visual styling** via CSS classes:
- `ui/Button.tsx` → wraps HeroUI `<Button>`, applies `.btn btn-primary|secondary|ghost` CSS
- `ui/GlassCard.tsx` → wraps HeroUI `<Card>`, applies `.glass-card` CSS
- `ui/Badge.tsx` → wraps HeroUI `<Chip>`, applies `.badge` CSS
- `ui/InsetPanel.tsx` → plain `<div>` (no HeroUI behavior needed)

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
Components use **project-specific wrapper components** that wrap HeroUI primitives. HeroUI provides behavior/accessibility; all visual styling comes from project CSS classes (`.btn`, `.glass-card`, `.badge`, `.inset-panel`).

The visual aesthetic enforces **dual-theme glassmorphism**: glass surfaces (`backdrop-filter: blur(16px)`) in both modes — darker glass `rgba(17,19,25,0.7)` in dark mode, lighter `rgba(255,255,255,0.7)` in light mode. Solid inset panels (`.inset-panel`) use `--surface-container` background with `--outline-variant` borders. Depth is created through glass opacity layers and glow drop shadows.

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
