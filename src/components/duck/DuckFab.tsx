import { PixelDuck, type DuckMood } from './PixelDuck';

type DuckFabProps = {
  open: boolean;
  unreadCount: number;
  attention: boolean;
  mood: DuckMood;
  onToggle: () => void;
};

export const DuckFab = ({ open, unreadCount, attention, mood, onToggle }: DuckFabProps) => {
  return (
    <button
      type="button"
      className={`duck-fab ${open ? 'is-open' : ''} ${attention ? 'is-attention' : ''}`}
      aria-label={open ? 'Закрыть Duck Assistant' : 'Открыть Duck Assistant'}
      onClick={onToggle}
    >
      <PixelDuck mood={mood} className="duck-fab-art" />
      {unreadCount > 0 ? <span className="duck-fab-badge">{unreadCount > 9 ? '9+' : unreadCount}</span> : null}
    </button>
  );
};
