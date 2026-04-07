import { useEffect, useState } from 'react';
import { apiService } from '../../lib/api/service';
import type { WebhookEvent } from '../../types/models';

type WebhookEventsPanelProps = {
  projectId: string;
};

const formatDate = (value: string): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const statusLabel = (status: string) => {
  if (status === 'processed') return 'Обработано';
  if (status === 'failed') return 'Ошибка';
  if (status === 'skipped') return 'Пропущено';
  return status || '—';
};

export const WebhookEventsPanel = ({ projectId }: WebhookEventsPanelProps) => {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    apiService
      .getWebhookEvents(projectId)
      .then((data) => {
        if (!cancelled) {
          setEvents(data.events);
          setTotal(data.total);
        }
      })
      .catch(() => {
        // silent
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return (
    <section className="gh-webhook-panel">
      <div className="gh-webhook-head">
        <h2>Webhook события</h2>
        <span className="gh-webhook-count">{total}</span>
      </div>

      {loading ? <p className="gh-repos-loading">Загрузка событий...</p> : null}

      {!loading && events.length === 0 ? (
        <p className="gh-repos-empty">Нет webhook событий. Привяжите репозиторий и сделайте push/merge.</p>
      ) : null}

      {events.length > 0 ? (
        <div className="gh-webhook-table">
          <div className="gh-webhook-row gh-webhook-header">
            <div>Дата</div>
            <div>Тип</div>
            <div>Ветка</div>
            <div>Закрытые задачи</div>
            <div>Статус</div>
          </div>
          {events.map((event) => (
            <div key={event.id} className="gh-webhook-row">
              <div>{formatDate(event.createdAt)}</div>
              <div><code>{event.eventType}</code></div>
              <div><code>{event.branch || '—'}</code></div>
              <div>
                {event.closedTasks.length > 0
                  ? event.closedTasks.map((key) => key.toUpperCase()).join(', ')
                  : '—'}
              </div>
              <div>
                <span className={`gh-webhook-status ${event.status}`}>
                  {statusLabel(event.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
};
