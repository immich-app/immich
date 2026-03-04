import { HttpException } from '@nestjs/common';
import { Readable } from 'node:stream';
import { CacheControl } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { ImmichFileResponse, ImmichRedirectResponse, ImmichStreamResponse, sendFile } from 'src/utils/file';
import { describe, expect, it, vi } from 'vitest';

describe('ImmichRedirectResponse', () => {
  it('should store redirect URL and cache control', () => {
    const response = new ImmichRedirectResponse({
      url: 'https://s3.amazonaws.com/bucket/key?sig=abc',
      cacheControl: CacheControl.PrivateWithCache,
    });
    expect(response.url).toBe('https://s3.amazonaws.com/bucket/key?sig=abc');
    expect(response.cacheControl).toBe(CacheControl.PrivateWithCache);
  });
});

describe('ImmichStreamResponse', () => {
  it('should store stream and metadata', () => {
    const stream = Readable.from([Buffer.from('data')]);
    const response = new ImmichStreamResponse({
      stream,
      contentType: 'image/jpeg',
      length: 4,
      cacheControl: CacheControl.PrivateWithCache,
    });
    expect(response.stream).toBe(stream);
    expect(response.contentType).toBe('image/jpeg');
    expect(response.length).toBe(4);
  });
});

describe('sendFile with ImmichMediaResponse', () => {
  let mockLogger: LoggingRepository;

  beforeEach(() => {
    mockLogger = { error: vi.fn(), setContext: vi.fn() } as unknown as LoggingRepository;
  });

  it('should send redirect response with 302', async () => {
    const res = {
      set: vi.fn(),
      header: vi.fn(),
      redirect: vi.fn(),
      headersSent: false,
    } as any;
    const next = vi.fn();

    await sendFile(
      res,
      next,
      () =>
        new ImmichRedirectResponse({
          url: 'https://s3.example.com/signed-url',
          cacheControl: CacheControl.PrivateWithCache,
        }),
      mockLogger,
    );

    expect(res.redirect).toHaveBeenCalledWith('https://s3.example.com/signed-url');
  });

  it('should pipe stream response', async () => {
    const stream = Readable.from([Buffer.from('streamed')]);
    const res = {
      set: vi.fn(),
      header: vi.fn(),
      headersSent: false,
      status: vi.fn().mockReturnThis(),
      end: vi.fn(),
    } as any;
    stream.pipe = vi.fn().mockReturnValue(res);
    const next = vi.fn();

    const handler = () =>
      new ImmichStreamResponse({
        stream,
        contentType: 'image/jpeg',
        length: 8,
        cacheControl: CacheControl.PrivateWithCache,
      });

    await sendFile(res, next, handler, mockLogger);

    expect(res.header).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
    expect(res.header).toHaveBeenCalledWith('Content-Length', '8');
  });

  it('should pipe stream response with fileName header', async () => {
    const stream = Readable.from([Buffer.from('streamed')]);
    const res = {
      set: vi.fn(),
      header: vi.fn(),
      headersSent: false,
    } as any;
    stream.pipe = vi.fn().mockReturnValue(res);
    const next = vi.fn();

    await sendFile(
      res,
      next,
      () =>
        new ImmichStreamResponse({
          stream,
          contentType: 'image/jpeg',
          cacheControl: CacheControl.PrivateWithCache,
          fileName: 'photo.jpg',
        }),
      mockLogger,
    );

    expect(res.header).toHaveBeenCalledWith(
      'Content-Disposition',
      `inline; filename*=UTF-8''photo.jpg`,
    );
  });

  it('should set cache-control for redirect with None', async () => {
    const res = {
      set: vi.fn(),
      header: vi.fn(),
      redirect: vi.fn(),
      headersSent: false,
    } as any;
    const next = vi.fn();

    await sendFile(
      res,
      next,
      () =>
        new ImmichRedirectResponse({
          url: 'https://example.com',
          cacheControl: CacheControl.None,
        }),
      mockLogger,
    );

    expect(res.set).not.toHaveBeenCalledWith('Cache-Control', expect.anything());
    expect(res.redirect).toHaveBeenCalledWith('https://example.com');
  });

  it('should send file response for ImmichFileResponse', async () => {
    const res = {
      set: vi.fn(),
      header: vi.fn(),
      headersSent: false,
      sendFile: vi.fn((_path: string, _options: any, cb: (err?: Error) => void) => cb()),
    } as any;
    const next = vi.fn();

    await sendFile(
      res,
      next,
      () =>
        new ImmichFileResponse({
          path: '/tmp/test-file.jpg',
          contentType: 'image/jpeg',
          cacheControl: CacheControl.PrivateWithCache,
        }),
      mockLogger,
    );

    expect(res.header).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
    expect(res.set).toHaveBeenCalledWith('Cache-Control', expect.stringContaining('private'));
  });

  it('should send file response with fileName for ImmichFileResponse', async () => {
    const res = {
      set: vi.fn(),
      header: vi.fn(),
      headersSent: false,
      sendFile: vi.fn((_path: string, _options: any, cb: (err?: Error) => void) => cb()),
    } as any;
    const next = vi.fn();

    await sendFile(
      res,
      next,
      () =>
        new ImmichFileResponse({
          path: '/tmp/test-file.jpg',
          contentType: 'image/jpeg',
          cacheControl: CacheControl.PrivateWithCache,
          fileName: 'my-photo.jpg',
        }),
      mockLogger,
    );

    expect(res.header).toHaveBeenCalledWith(
      'Content-Disposition',
      `inline; filename*=UTF-8''my-photo.jpg`,
    );
  });

  it('should handle non-http errors by logging and calling next', async () => {
    const error = new Error('Something went wrong');
    const res = {
      set: vi.fn(),
      header: vi.fn(),
      headersSent: false,
    } as any;
    const next = vi.fn();

    await sendFile(res, next, () => Promise.reject(error), mockLogger);

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Unable to send file'), error.stack);
    expect(res.header).toHaveBeenCalledWith('Cache-Control', 'none');
    expect(next).toHaveBeenCalledWith(error);
  });

  it('should not log HttpException errors', async () => {
    const error = new HttpException('Not Found', 404);
    const res = {
      set: vi.fn(),
      header: vi.fn(),
      headersSent: false,
    } as any;
    const next = vi.fn();

    await sendFile(res, next, () => Promise.reject(error), mockLogger);

    expect(mockLogger.error).not.toHaveBeenCalled();
    expect(res.header).toHaveBeenCalledWith('Cache-Control', 'none');
    expect(next).toHaveBeenCalledWith(error);
  });

  it('should silently ignore connection aborted errors', async () => {
    const error = new Error('Connection aborted');
    (error as any).code = 'ECONNABORTED';
    const res = {
      set: vi.fn(),
      header: vi.fn(),
      headersSent: false,
    } as any;
    const next = vi.fn();

    await sendFile(res, next, () => Promise.reject(error), mockLogger);

    expect(next).not.toHaveBeenCalled();
  });

  it('should silently return if headers are already sent', async () => {
    const error = new Error('Something went wrong');
    const res = {
      set: vi.fn(),
      header: vi.fn(),
      headersSent: true,
    } as any;
    const next = vi.fn();

    await sendFile(res, next, () => Promise.reject(error), mockLogger);

    expect(next).not.toHaveBeenCalled();
  });
});
