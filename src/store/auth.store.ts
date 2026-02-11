import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { apiService, type SignInPayload } from '../lib/api/service';
import type { AuthProfile } from '../types/models';

type AuthState = {
  token: string | null;
  user: AuthProfile | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  meLoading: boolean;
  meLoaded: boolean;
  login: (payload: SignInPayload) => Promise<void>;
  setToken: (token: string) => void;
  loadMe: () => Promise<void>;
  logout: () => void;
  restoreSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist<AuthState>(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      hydrated: false,
      meLoading: false,
      meLoaded: false,
      async login(payload) {
        const token = await apiService.signin(payload);
        set({
          token,
          isAuthenticated: token.length > 0,
          user: null,
          meLoaded: false,
        });

        if (token.length > 0) {
          await get().loadMe();
        }
      },
      setToken(token) {
        set({
          token,
          isAuthenticated: token.length > 0,
          user: null,
          meLoaded: false,
        });
      },
      async loadMe() {
        const { token, meLoading, meLoaded } = get();

        if (!token) {
          set({ user: null, meLoading: false, meLoaded: false });
          return;
        }

        if (meLoading || meLoaded) {
          return;
        }

        set({ meLoading: true });
        try {
          const user = await apiService.getMe();
          set({ user, meLoading: false, meLoaded: true });
        } catch {
          set({ meLoading: false, meLoaded: true });
        }
      },
      logout() {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          meLoading: false,
          meLoaded: false,
        });
      },
      restoreSession() {
        set((state) => ({
          hydrated: true,
          isAuthenticated: Boolean(state.token),
          meLoaded: Boolean(state.user),
        }));
      },
    }),
    {
      name: 'popuitka2.auth',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.restoreSession();
        }
      },
    },
  ),
);
