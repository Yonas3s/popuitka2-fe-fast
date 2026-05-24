export type WorkspaceReleaseSection = {
  title: string;
  items: string[];
};

export type WorkspaceReleasePreview = {
  eyebrow: string;
  title: string;
  caption: string;
  tone: 'workspace' | 'client';
};

export const WORKSPACE_RELEASE = {
  id: 'workspace-2026-05-product-shell-redesign',
  badge: 'Большое обновление',
  title: 'Интерфейс стал чище и взрослее',
  summary:
    'Пересобрали рабочую зону в более спокойный продуктовый интерфейс: постоянный сайдбар, понятная навигация, меньше лишних кнопок и аккуратнее страницы проектов, команд и настроек.',
  previews: [
    {
      eyebrow: 'Рабочая зона',
      title: 'Единый сайдбар и чистый topbar',
      caption: 'Проекты, команды, настройки и контекст проекта теперь лежат в одном месте. Лишние моковые пункты и нерабочие кнопки убраны.',
      tone: 'workspace',
    },
    {
      eyebrow: 'Проекты и настройки',
      title: 'Меньше воздуха, больше смысла',
      caption: 'Заголовки, карточки, settings-страницы и stage-view стали компактнее, ровнее и ближе к привычному SaaS-интерфейсу.',
      tone: 'client',
    },
  ] satisfies WorkspaceReleasePreview[],
  sections: [
    {
      title: 'Навигация',
      items: [
        'Добавили постоянный workspace sidebar для проектов, команд и настроек.',
        'Контекст текущего проекта и этапа переехал в sidebar, поэтому рабочая область стала чище.',
        'Sidebar можно свернуть: иконки остаются ровными, без прыжков и лишних отступов.',
      ],
    },
    {
      title: 'Визуальная полировка',
      items: [
        'Убрали заглушечные пункты вроде Inbox, My tasks и Views.',
        'Сделали topbar реальным: breadcrumbs берут данные текущего проекта и этапа.',
        'Сжали лишние вертикальные отступы в Profile, GitHub и Telegram настройках.',
      ],
    },
    {
      title: 'Проекты и этапы',
      items: [
        'Страницы проектов, команд, настроек и этапов теперь выглядят как один продукт, а не набор разных экранов.',
        'Кнопки и карточки выровнены под светлый Linear-like стиль.',
        'Свернутый sidebar занимает меньше места, но сохраняет быстрый доступ к основным разделам.',
      ],
    },
  ] satisfies WorkspaceReleaseSection[],
} as const;

export const getWorkspaceReleaseStorageKey = (releaseId: string) =>
  `unit-labs.workspace-release:${releaseId}`;
