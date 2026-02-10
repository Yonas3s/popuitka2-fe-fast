import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { GlassPanel } from '../components/ui/GlassPanel';

export const NotFoundPage = () => {
  return (
    <PageShell title="404" subtitle="Страница не найдена.">
      <GlassPanel>
        <p>Похоже, URL неверный или ресурс уже удален.</p>
        <Link className="cta" to="/">
          На главную
        </Link>
      </GlassPanel>
    </PageShell>
  );
};
