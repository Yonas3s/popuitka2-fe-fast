export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'https://popuitka2-be.onrender.com';

export const APP_TITLE = import.meta.env.VITE_APP_TITLE?.trim() || 'unit-labs';

export const FRONTEND_BASE_URL = import.meta.env.VITE_FRONTEND_BASE_URL?.trim() || '';

export const APP_DISPLAY_YEAR = 2026;

export const APP_COPYRIGHT_TEXT = `© ${APP_DISPLAY_YEAR} unit-labs inc. Все протоколы защищены.`;
