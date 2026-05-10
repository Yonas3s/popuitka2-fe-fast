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
  id: 'workspace-2026-05-workspace-polish-release',
  badge: 'Большое обновление',
  title: 'Рабочая зона стала взрослее',
  summary:
    'Собрали последние изменения в один релиз: меньше хаоса на страницах проекта, понятнее клиентская ссылка и аккуратнее работа с задачами на узких экранах.',
  previews: [
    {
      eyebrow: 'Рабочие страницы',
      title: 'Разделы, фильтры и статус этапа',
      caption: 'Навигация стала отдельной, фильтры переехали в компактную панель, статус этапа теперь читается как release-control.',
      tone: 'workspace',
    },
    {
      eyebrow: 'Клиентская ссылка',
      title: 'Превью результата и задачи',
      caption: 'Клиент видит не голую ссылку, а карточку результата, этапы и задачи внутри stage workflow.',
      tone: 'client',
    },
  ] satisfies WorkspaceReleasePreview[],
  sections: [
    {
      title: 'Проекты и этапы',
      items: [
        'Репозитории, Telegram, webhooks и контекст вынесены в настройки проекта/этапа, чтобы главная страница не превращалась в свалку.',
        'Для этапов добавлен боковой раздел “Задачи / Настройки”, а статус этапа теперь показывает текущую фазу релиза отдельным контролом.',
        'Направления и теги приведены к одному поведению для flat и stages проектов.',
      ],
    },
    {
      title: 'Задачи',
      items: [
        'Список задач больше не уезжает вправо на 992-1224px: длинные названия ужимаются, а бейджи остаются читаемыми.',
        'Фильтры типа, направления, приоритета и отображаемых колонок собраны в одну панель рядом с List/Board.',
        'Запрос ревью теперь проходит через подтверждение, чтобы случайно не отправить этап на проверку.',
      ],
    },
    {
      title: 'Клиент и безопасность',
      items: [
        'Клиентская страница показывает preview результата, задачи внутри stages и нормально раскрывает длинные названия задач.',
        'Внешние рабочие ссылки проходят HTTP/HTTPS-проверку перед открытием и сохранением.',
        'Поддержка в футтерах ведет на info@unit-labs.ru, а год в интерфейсе приведен к 2026.',
      ],
    },
  ] satisfies WorkspaceReleaseSection[],
} as const;

export const getWorkspaceReleaseStorageKey = (releaseId: string) =>
  `unit-labs.workspace-release:${releaseId}`;
