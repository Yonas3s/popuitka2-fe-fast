export type WorkspaceReleaseSection = {
  title: string;
  items: string[];
};

export const WORKSPACE_RELEASE = {
  id: 'workspace-2026-05-client-share-update',
  badge: 'Майский релиз',
  title: 'Что нового в рабочей зоне',
  summary:
    'Это окно показывается один раз после входа на рабочие страницы. В этом релизе обновили клиентский контур, поддержку и отображение больших апдейтов.',
  sections: [
    {
      title: 'Клиентская ссылка',
      items: [
        'В stage workflow клиент теперь видит не только этапы, но и задачи внутри каждого этапа.',
        'Задачи открываются как отдельная карточка по клику и поддерживают deeplink через параметр ?task=...',
        'На мобильных экранах список задач и шапка клиентской страницы приведены ближе к рабочим страницам.',
      ],
    },
    {
      title: 'Результат этапа',
      items: [
        'Если исполнитель добавил ссылку на результат, клиент увидит preview-card вместо голой ссылки.',
        'Для Vercel, Netlify и Figma карточка помечается понятным бейджем, а при недоступном thumbnail остаётся аккуратный fallback.',
      ],
    },
    {
      title: 'Поддержка и релизы',
      items: [
        'В футтерах рабочих и публичных страниц есть быстрый переход в поддержку по почте info@unit-labs.ru.',
        'Для следующего большого релиза достаточно обновить этот список и новый release id, чтобы снова показать окно один раз.',
      ],
    },
  ] satisfies WorkspaceReleaseSection[],
} as const;

export const getWorkspaceReleaseStorageKey = (releaseId: string) =>
  `unit-labs.workspace-release:${releaseId}`;
