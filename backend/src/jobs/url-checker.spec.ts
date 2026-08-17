import { afterEach, describe, expect, it } from '@jest/globals';
import { URL_ERROR_TIMEOUT } from './jobs.constants';
import { isHttpUrl, UrlChecker } from './url-checker';

describe('UrlChecker', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('accepts only http and https URLs', () => {
    expect(isHttpUrl('https://yandex.ru')).toBe(true);
    expect(isHttpUrl('http://yandex.ru/path')).toBe(true);
    expect(isHttpUrl('not-a-url')).toBe(false);
    expect(isHttpUrl('ftp://yandex.ru')).toBe(false);
  });

  it('returns HEAD status when the server answers', async () => {
    global.fetch = (_url, init) => {
      expect(init?.method).toBe('HEAD');
      return Promise.resolve(new Response(null, { status: 404 }));
    };

    const result = await new UrlChecker().check('https://yandex.ru');
    expect(result).toEqual({ ok: true, httpStatus: 404 });
  });

  it('retries with GET when HEAD returns 405', async () => {
    const methods: string[] = [];
    global.fetch = (_url, init) => {
      const method = init?.method ?? 'GET';
      methods.push(method);
      return Promise.resolve(
        new Response(null, { status: method === 'HEAD' ? 405 : 200 }),
      );
    };

    const result = await new UrlChecker().check('https://yandex.ru');
    expect(methods).toEqual(['HEAD', 'GET']);
    expect(result).toEqual({ ok: true, httpStatus: 200 });
  });

  it('maps abort timeout to Request timed out', async () => {
    global.fetch = (_url, init) => {
      const signal = init?.signal;
      return new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () => {
          reject(Object.assign(new Error('Aborted'), { name: 'TimeoutError' }));
        });
      });
    };

    const result = await new UrlChecker().check('https://yandex.ru', {
      timeoutMs: 20,
    });
    expect(result).toEqual({ ok: false, error: URL_ERROR_TIMEOUT });
  });
});
