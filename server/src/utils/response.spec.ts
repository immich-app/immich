import type { Response } from 'express';
import { ImmichCookie } from 'src/enum.js';
import { respondWithCookie, respondWithoutCookie } from 'src/utils/response.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('cookie responses', () => {
  const response = {
    clearCookie: vi.fn(),
    cookie: vi.fn(),
  } as unknown as Response;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the root cookie path by default', () => {
    respondWithCookie(response, undefined, {
      isSecure: false,
      values: [{ key: ImmichCookie.AccessToken, value: 'token' }],
    });

    expect(response.cookie).toHaveBeenCalledWith(
      ImmichCookie.AccessToken,
      'token',
      expect.objectContaining({ path: '/' }),
    );
  });

  it('uses the configured base path when setting cookies', () => {
    respondWithCookie(response, undefined, {
      basePath: '/immich',
      isSecure: false,
      values: [{ key: ImmichCookie.AccessToken, value: 'token' }],
    });

    expect(response.cookie).toHaveBeenCalledWith(
      ImmichCookie.AccessToken,
      'token',
      expect.objectContaining({ path: '/immich' }),
    );
  });

  it('uses the configured base path when clearing cookies', () => {
    respondWithoutCookie(response, undefined, [ImmichCookie.AccessToken], '/immich');

    expect(response.clearCookie).toHaveBeenCalledWith(ImmichCookie.AccessToken, { path: '/immich' });
  });
});
