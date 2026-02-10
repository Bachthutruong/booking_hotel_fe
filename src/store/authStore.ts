import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
}

let resolveRehydrated: () => void;
let rehydratedDone = false;
const markRehydrated = () => {
  if (!rehydratedDone) {
    rehydratedDone = true;
    resolveRehydrated();
  }
};
/** Promise resolve khi persist đã rehydrate xong (tránh đọc token = null lúc mới load/ẩn danh) */
export const rehydratedPromise = new Promise<void>((r) => {
  resolveRehydrated = r;
  setTimeout(markRehydrated, 150);
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) =>
        set({ user, isAuthenticated: !!user }),

      setToken: (token) => {
        if (token) {
          localStorage.setItem('token', token);
        } else {
          localStorage.removeItem('token');
        }
        set({ token });
      },

      setLoading: (isLoading) => set({ isLoading }),

      login: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true, isLoading: false });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          try {
            localStorage.setItem('token', state.token);
          } catch (_) {}
        }
        markRehydrated();
      },
    }
  )
);
