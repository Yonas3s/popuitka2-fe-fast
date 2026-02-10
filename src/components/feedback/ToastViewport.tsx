import { useUiStore } from '../../store/ui.store';

export const ToastViewport = () => {
  const toasts = useUiStore((state) => state.toasts);
  const removeToast = useUiStore((state) => state.removeToast);

  return (
    <aside className="toast-viewport" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
          <button type="button" className="ghost-link" onClick={() => removeToast(toast.id)}>
            закрыть
          </button>
        </div>
      ))}
    </aside>
  );
};
