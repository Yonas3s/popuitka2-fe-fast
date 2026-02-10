import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { apiService, type SignInPayload } from '../lib/api/service';

type AuthState = {
  token: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  login: (payload: SignInPayload) => Promise<void>;
  setToken: (token: string) => void;
  logout: () => void;
  restoreSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      hydrated: false,
      async login(payload) {
        const token = await apiService.signin(payload);
        set({ token, isAuthenticated: token.length > 0 });
      },
      setToken(token) {
        set({ token, isAuthenticated: token.length > 0 });
      },
      logout() {
        set({ token: null, isAuthenticated: false });
      },
      restoreSession() {
        set((state) => ({
          hydrated: true,
          isAuthenticated: Boolean(state.token),
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
