import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ResetFlowState = {
  email: string;
  code: string;
  setEmail: (email: string) => void;
  setCode: (code: string) => void;
  setFlow: (email: string, code: string) => void;
  clearFlow: () => void;
};

export const useResetFlowStore = create<ResetFlowState>()(
  persist(
    (set) => ({
      email: '',
      code: '',
      setEmail(email) {
        set({ email });
      },
      setCode(code) {
        set({ code });
      },
      setFlow(email, code) {
        set({ email, code });
      },
      clearFlow() {
        set({ email: '', code: '' });
      },
    }),
    {
      name: 'popuitka2.reset-flow',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
