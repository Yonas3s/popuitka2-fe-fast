const LOCAL_HTTP_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']);

const isLocalHttpHost = (hostname: string) => {
  const normalized = hostname.toLowerCase();
  return LOCAL_HTTP_HOSTS.has(normalized) || normalized.endsWith('.localhost');
};

export const parseSafeExternalUrl = (value: string): URL | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();

    if (protocol === 'https:') {
      return parsed;
    }

    if (protocol === 'http:' && isLocalHttpHost(parsed.hostname)) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
};

export const normalizeSafeExternalUrl = (value: string) => parseSafeExternalUrl(value)?.toString() ?? null;
