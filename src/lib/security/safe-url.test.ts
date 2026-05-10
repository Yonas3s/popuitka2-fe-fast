import { describe, expect, it } from 'vitest';
import { normalizeSafeExternalUrl, parseSafeExternalUrl } from './safe-url';

describe('safe external urls', () => {
  it('allows https links', () => {
    expect(normalizeSafeExternalUrl(' https://unit-labs.vercel.app/demo ')).toBe(
      'https://unit-labs.vercel.app/demo',
    );
  });

  it('allows localhost http links for local previews', () => {
    expect(parseSafeExternalUrl('http://127.0.0.1:5173/projects')?.origin).toBe('http://127.0.0.1:5173');
    expect(parseSafeExternalUrl('http://preview.localhost:5173')?.hostname).toBe('preview.localhost');
  });

  it('rejects dangerous and non-production schemes', () => {
    expect(parseSafeExternalUrl('javascript:alert(1)')).toBeNull();
    expect(parseSafeExternalUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(parseSafeExternalUrl('ftp://example.com/file')).toBeNull();
    expect(parseSafeExternalUrl('https://unit-labs.vercel.app')).not.toBeNull();
  });

  it('rejects external plaintext http links', () => {
    expect(parseSafeExternalUrl('http://example.com')).toBeNull();
  });
});
