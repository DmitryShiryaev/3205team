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

  it('treats 4xx as error with httpStatus', async () => {
    global.fetch = (_url, init) => {
      expect(init?.method).toBe('HEAD');
      return Promise.resolve(new Response(null, { status: 404 }));
    };

    const result = await new UrlChecker().check('https://yandex.ru');
    expect(result).toEqual({
      ok: false,
      httpStatus: 404,
      error: 'HTTP 404',
    });
  });

  it('treats 2xx and 3xx as success', async () => {
    const checker = new UrlChecker();

    global.fetch = (_url, init) => {
      expect(init?.method).toBe('HEAD');
      return Promise.resolve(new Response(null, { status: 200 }));
    };
    await expect(checker.check('https://yandex.ru')).resolves.toEqual({
      ok: true,
      httpStatus: 200,
    });

    global.fetch = (_url, init) => {
      expect(init?.method).toBe('HEAD');
      return Promise.resolve(new Response(null, { status: 301 }));
    };
    await expect(checker.check('https://yandex.ru')).resolves.toEqual({
      ok: true,
      httpStatus: 301,
    });
  });

  it('treats 5xx as error with httpStatus', async () => {
    global.fetch = (_url, init) => {
      expect(init?.method).toBe('HEAD');
      return Promise.resolve(new Response(null, { status: 503 }));
    };

    const result = await new UrlChecker().check('https://yandex.ru');
    expect(result).toEqual({
      ok: false,
      httpStatus: 503,
      error: 'HTTP 503',
    });
  });

  it('does not retry with GET when HEAD returns 405', async () => {
    const methods: string[] = [];
    global.fetch = (_url, init) => {
      const method = init?.method ?? 'GET';
      methods.push(method);
      return Promise.resolve(
        new Response(null, { status: method === 'HEAD' ? 405 : 200 }),
      );
    };

    const result = await new UrlChecker().check('https://yandex.ru');
    expect(methods).toEqual(['HEAD']);
    expect(result).toEqual({
      ok: false,
      httpStatus: 405,
      error: 'HTTP 405',
    });
  });

  // GET-fallback при 405 (отключён):
  // it('retries with GET when HEAD returns 405', async () => {
  //   const methods: string[] = [];
  //   global.fetch = (_url, init) => {
  //     const method = init?.method ?? 'GET';
  //     methods.push(method);
  //     return Promise.resolve(
  //       new Response(null, { status: method === 'HEAD' ? 405 : 200 }),
  //     );
  //   };
  //
  //   const result = await new UrlChecker().check('https://yandex.ru');
  //   expect(methods).toEqual(['HEAD', 'GET']);
  //   expect(result).toEqual({ ok: true, httpStatus: 200 });
  // });

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
