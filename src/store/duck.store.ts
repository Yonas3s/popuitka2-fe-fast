import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type DuckMessageRole = 'user' | 'assistant';

export type DuckMessage = {
  id: string;
  role: DuckMessageRole;
  text: string;
  createdAt: string;
};

type DuckState = {
  isOpen: boolean;
  isTyping: boolean;
  unreadCount: number;
  draft: string;
  model: string;
  createTasks: boolean;
  taskLimit: number;
  preferredStageId: string | null;
  messages: DuckMessage[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  setTyping: (value: boolean) => void;
  setDraft: (value: string) => void;
  setModel: (value: string) => void;
  setCreateTasks: (value: boolean) => void;
  setTaskLimit: (value: number) => void;
  setPreferredStageId: (value: string | null) => void;
  pushUserMessage: (text: string) => DuckMessage;
  pushAssistantMessage: (text: string) => DuckMessage;
  resetConversation: () => void;
};

const buildMessage = (role: DuckMessageRole, text: string): DuckMessage => ({
  id: `duck-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  text,
  createdAt: new Date().toISOString(),
});

export const useDuckStore = create<DuckState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      isTyping: false,
      unreadCount: 0,
      draft: '',
      model: '',
      createTasks: true,
      taskLimit: 7,
      preferredStageId: null,
      messages: [],

      open() {
        set({ isOpen: true, unreadCount: 0 });
      },

      close() {
        set({ isOpen: false });
      },

      toggle() {
        const { isOpen } = get();
        if (isOpen) {
          set({ isOpen: false });
          return;
        }
        set({ isOpen: true, unreadCount: 0 });
      },

      setTyping(value) {
        set({ isTyping: value });
      },

      setDraft(value) {
        set({ draft: value });
      },

      setModel(value) {
        set({ model: value });
      },

      setCreateTasks(value) {
        set({ createTasks: value });
      },

      setTaskLimit(value) {
        const clamped = Math.min(20, Math.max(1, Math.floor(value || 1)));
        set({ taskLimit: clamped });
      },

      setPreferredStageId(value) {
        set({ preferredStageId: value });
      },

      pushUserMessage(text) {
        const message = buildMessage('user', text.trim());
        set((state) => ({
          messages: [...state.messages, message],
        }));
        return message;
      },

      pushAssistantMessage(text) {
        const message = buildMessage('assistant', text.trim());
        set((state) => ({
          messages: [...state.messages, message],
          unreadCount: state.isOpen ? state.unreadCount : state.unreadCount + 1,
        }));
        return message;
      },

      resetConversation() {
        set({
          messages: [],
          draft: '',
          isTyping: false,
          unreadCount: 0,
        });
      },
    }),
    {
      name: 'popuitka2.duck',
      // v2: drop the hardcoded "gemini-2.5-flash" default that used to be
      // forced here. Older clients still have it persisted in localStorage;
      // migrate() below clears it so the backend can pick the current
      // provider's default (e.g. llama-3.3-70b-versatile on Groq).
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown, version: number) => {
        const state = (persistedState as Record<string, unknown>) || {};
        if (version < 2) {
          if (typeof state.model === 'string' && /gemini|gpt-|openai/i.test(state.model)) {
            state.model = '';
          }
        }
        return state as DuckState;
      },
      partialize: (state) => ({
        unreadCount: state.unreadCount,
        model: state.model,
        createTasks: state.createTasks,
        taskLimit: state.taskLimit,
        preferredStageId: state.preferredStageId,
        messages: state.messages.slice(-30),
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }
        state.isOpen = false;
        state.isTyping = false;
        state.draft = '';
        // Second layer of defence against stale hardcoded models from v1.
        if (state.model && /^gemini|^gpt-|^openai/i.test(state.model)) {
          state.model = '';
        }
      },
    },
  ),
);
