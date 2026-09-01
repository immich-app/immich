import { NotFoundException } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { CacheControl } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { ImmichFileResponse, sendFile } from 'src/utils/file';
import { Mocked } from 'vitest';

describe('sendFile', () => {
  let res: Mocked<Response>;
  let next: Mocked<NextFunction>;
  let logger: Mocked<LoggingRepository>;

  beforeEach(() => {
    res = {
      set: vi.fn(),
      header: vi.fn(),
      sendFile: vi.fn((_path, _options, callback: (error?: Error) => void) => callback()),
      headersSent: false,
    } as unknown as Mocked<Response>;
    next = vi.fn();
    logger = { error: vi.fn() } as unknown as Mocked<LoggingRepository>;
  });

  it('should set the cache-control header for a cacheable file', async () => {
    const file = new ImmichFileResponse({
      path: 'package.json',
      contentType: 'text/plain',
      cacheControl: CacheControl.PrivateWithCache,
    });

    await sendFile(res, next, () => file, logger);

    expect(res.set).toHaveBeenCalledWith(
      'Cache-Control',
      'private, max-age=86400, no-transform, stale-while-revalidate=2592000, stale-if-error=2592000',
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should respond with no-store when the file is not accessible', async () => {
    const file = new ImmichFileResponse({
      path: '/path/to/missing/file',
      contentType: 'video/mp4',
      cacheControl: CacheControl.PrivateWithCache,
    });

    await sendFile(res, next, () => file, logger);

    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'private, no-store');
    expect(res.set).not.toHaveBeenCalledWith('Cache-Control', expect.stringContaining('max-age'));
    expect(next).toHaveBeenCalledWith(expect.any(NotFoundException));
  });

  it('should override a previously set cache-control header when sending fails', async () => {
    const file = new ImmichFileResponse({
      path: 'package.json',
      contentType: 'text/plain',
      cacheControl: CacheControl.PrivateWithCache,
    });
    res.sendFile.mockImplementation(((_path: string, _options: unknown, callback?: (error?: Error) => void) =>
      callback?.(new Error('send failed'))) as unknown as Response['sendFile']);

    await sendFile(res, next, () => file, logger);

    expect(res.set).toHaveBeenLastCalledWith('Cache-Control', 'private, no-store');
    expect(next).toHaveBeenCalledWith(expect.any(NotFoundException));
  });

  it('should not touch the response when the connection is aborted', async () => {
    const abortError = Object.assign(new Error('aborted'), { code: 'ECONNABORTED' });

    await sendFile(
      res,
      next,
      () => {
        throw abortError;
      },
      logger,
    );

    expect(res.set).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
