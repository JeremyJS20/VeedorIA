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
