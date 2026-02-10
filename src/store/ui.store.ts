import { create } from 'zustand';
import type { Toast, ToastType } from '../types/models';

type ConfirmModal = {
  open: boolean;
  title: string;
  description: string;
  onConfirm?: () => void;
};

type UiState = {
  toasts: Toast[];
  confirmModal: ConfirmModal;
  pushToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  openConfirm: (params: Omit<ConfirmModal, 'open'>) => void;
  closeConfirm: () => void;
  confirm: () => void;
};

export const useUiStore = create<UiState>((set, get) => ({
  toasts: [],
  confirmModal: {
    open: false,
    title: '',
    description: '',
  },
  pushToast(message, type = 'info') {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }));

    window.setTimeout(() => {
      get().removeToast(id);
    }, 3500);
  },
  removeToast(id) {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
  openConfirm(params) {
    set({
      confirmModal: {
        ...params,
        open: true,
      },
    });
  },
  closeConfirm() {
    set({
      confirmModal: {
        open: false,
        title: '',
        description: '',
      },
    });
  },
  confirm() {
    const action = get().confirmModal.onConfirm;
    if (action) {
      action();
    }
    get().closeConfirm();
  },
}));
