export const OAUTH_POST_LOGIN_REDIRECT_KEY = 'oauth_post_login_redirect';
export const OAUTH_CALLBACK_REDIRECT_KEY = 'oauth_callback_redirect_target';

export const sanitizeRedirectPath = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return null;
  }

  return trimmed;
};

export const getRedirectFromSearch = (search: string): string | null => {
  const params = new URLSearchParams(search);
  return sanitizeRedirectPath(params.get('redirect'));
};

export const withRedirectQuery = (path: string, redirectPath?: string | null): string => {
  const safeRedirect = sanitizeRedirectPath(redirectPath);
  if (!safeRedirect) {
    return path;
  }

  return `${path}?redirect=${encodeURIComponent(safeRedirect)}`;
};
