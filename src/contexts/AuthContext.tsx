"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'EDITOR' | 'USER';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const AUTO_LOGIN = process.env.NEXT_PUBLIC_AUTO_LOGIN === 'true';

  useEffect(() => {
    // Don't check auth on sign-in page (including nested routes)
    if (pathname?.startsWith('/sign-in')) {
      setLoading(false);
      return;
    }
    // Dev-only auto login to simplify local UI testing
    if (AUTO_LOGIN && pathname?.startsWith('/admin')) {
      const mockUser: User = {
        id: 'auto-dev',
        email: 'admin@sakhu.org',
        name: 'Dev Admin',
        role: 'ADMIN',
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);
      setLoading(false);
      return;
    }
    checkAuth();
  }, [pathname]);

  const checkAuth = async () => {
    // Skip auth check on sign-in page (including nested routes)
    if (pathname?.startsWith('/sign-in')) {
      setLoading(false);
      return;
    }

    try {
      // Check if user is stored in localStorage
      const storedUser = localStorage.getItem('user');
      
      if (storedUser) {
        // Verify with backend
        const res = await fetch('/api/auth/me');
        
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Token invalid, clear storage
          localStorage.removeItem('user');
          if (pathname?.startsWith('/admin')) {
            router.push('/sign-in');
          }
        }
      } else {
        // No user in storage
        if (pathname?.startsWith('/admin')) {
          router.push('/sign-in');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      if (pathname?.startsWith('/admin')) {
        router.push('/sign-in');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      setUser(null);
      router.push('/sign-in');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
