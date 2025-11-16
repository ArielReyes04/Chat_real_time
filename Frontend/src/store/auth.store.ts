import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { TOKEN_KEY, USER_KEY } from '../utils/constants';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: localStorage.getItem(TOKEN_KEY),
      isAuthenticated: !!localStorage.getItem(TOKEN_KEY),
      isLoading: false,

      setUser: (user) =>
        set((state) => ({
          user,
          isAuthenticated: !!user || !!state.token,
        })),

      setToken: (token) => {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);

        set((state) => ({
          token,
          isAuthenticated: !!token || !!state.user,
        }));
      },

      setLoading: (loading) => set({ isLoading: loading }),

      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);