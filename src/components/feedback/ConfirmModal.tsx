import { useUiStore } from '../../store/ui.store';
import { GradientButton } from '../ui/GradientButton';

export const ConfirmModal = () => {
  const modal = useUiStore((state) => state.confirmModal);
  const closeConfirm = useUiStore((state) => state.closeConfirm);
  const confirm = useUiStore((state) => state.confirm);

  if (!modal.open) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="panel modal" role="dialog" aria-modal="true">
        <h3>{modal.title}</h3>
        <p>{modal.description}</p>
        <div className="modal-actions">
          <button type="button" className="ghost-link" onClick={closeConfirm}>
            Отмена
          </button>
          <GradientButton type="button" onClick={confirm}>
            Подтвердить
          </GradientButton>
        </div>
      </section>
    </div>
  );
};
