import { NextFunction, Response } from 'express';
import { EventEmitter } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough, Readable } from 'node:stream';
import { CacheControl } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { ImmichFileResponse, sendFile } from 'src/utils/file';

const identityDecrypt = (cipherStream: Readable) => cipherStream.pipe(new PassThrough());

describe(sendFile.name, () => {
  let dir: string;
  let filePath: string;
  let plaintext: Buffer;
  let logger: LoggingRepository;
  let next: NextFunction;

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'immich-send-file-'));
    filePath = join(dir, 'plaintext.bin');
    // large enough to span several internal stream chunks
    plaintext = Buffer.from(Array.from({ length: 200_000 }, (_, i) => i % 256));
    await writeFile(filePath, plaintext);
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  beforeEach(() => {
    logger = { error: vitest.fn() } as unknown as LoggingRepository;
    next = vitest.fn();
  });

  const createRes = (rangeHeader?: string) => {
    const chunks: Buffer[] = [];
    const writable = new PassThrough();
    writable.on('data', (chunk) => {
      chunks.push(chunk as Buffer);
    });

    const req = Object.assign(new EventEmitter(), { headers: { range: rangeHeader } });
    const headers: Record<string, string> = {};
    const res = Object.assign(writable, {
      req,
      headersSent: false,
      statusCode: 200,
      status(code: number) {
        res.statusCode = code;
        return res;
      },
      header(name: string, value: string) {
        headers[name] = value;
        return res;
      },
      set(name: string, value: string) {
        headers[name] = value;
        return res;
      },
    }) as unknown as Response & { statusCode: number };

    return { res, headers, getBody: () => Buffer.concat(chunks) };
  };

  it('streams the full decrypted file when no Range header is present', async () => {
    const { res, headers, getBody } = createRes();

    await sendFile(
      res,
      next,
      () =>
        new ImmichFileResponse({
          path: filePath,
          contentType: 'application/octet-stream',
          cacheControl: CacheControl.None,
          decrypt: identityDecrypt,
        }),
      logger,
    );

    expect(res.statusCode).toBe(200);
    expect(headers['Content-Length']).toBe(String(plaintext.length));
    expect(headers['Accept-Ranges']).toBe('bytes');
    expect(getBody()).toEqual(plaintext);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns only the requested byte range with a 206 and matching Content-Range', async () => {
    const { res, headers, getBody } = createRes('bytes=100-199');

    await sendFile(
      res,
      next,
      () =>
        new ImmichFileResponse({
          path: filePath,
          contentType: 'application/octet-stream',
          cacheControl: CacheControl.None,
          decrypt: identityDecrypt,
        }),
      logger,
    );

    expect(res.statusCode).toBe(206);
    expect(headers['Content-Range']).toBe(`bytes 100-199/${plaintext.length}`);
    expect(headers['Content-Length']).toBe('100');
    expect(getBody()).toEqual(plaintext.subarray(100, 200));
    expect(next).not.toHaveBeenCalled();
  });

  it('supports an open-ended range ("bytes=N-")', async () => {
    const { res, headers, getBody } = createRes(`bytes=${plaintext.length - 50}-`);

    await sendFile(
      res,
      next,
      () =>
        new ImmichFileResponse({
          path: filePath,
          contentType: 'application/octet-stream',
          cacheControl: CacheControl.None,
          decrypt: identityDecrypt,
        }),
      logger,
    );

    expect(res.statusCode).toBe(206);
    expect(getBody()).toEqual(plaintext.subarray(-50));
    expect(headers['Content-Length']).toBe('50');
  });

  it('supports a suffix range ("bytes=-N")', async () => {
    const { res, getBody } = createRes('bytes=-50');

    await sendFile(
      res,
      next,
      () =>
        new ImmichFileResponse({
          path: filePath,
          contentType: 'application/octet-stream',
          cacheControl: CacheControl.None,
          decrypt: identityDecrypt,
        }),
      logger,
    );

    expect(res.statusCode).toBe(206);
    expect(getBody()).toEqual(plaintext.subarray(-50));
  });

  it('responds 416 with Content-Range when the requested range is out of bounds', async () => {
    const { res, headers, getBody } = createRes(`bytes=${plaintext.length + 100}-${plaintext.length + 200}`);

    await sendFile(
      res,
      next,
      () =>
        new ImmichFileResponse({
          path: filePath,
          contentType: 'application/octet-stream',
          cacheControl: CacheControl.None,
          decrypt: identityDecrypt,
        }),
      logger,
    );

    expect(res.statusCode).toBe(416);
    expect(headers['Content-Range']).toBe(`bytes */${plaintext.length}`);
    expect(getBody().length).toBe(0);
  });

  it('falls back to a full response for a malformed/multi-range Range header', async () => {
    const { res, getBody } = createRes('bytes=0-10,20-30');

    await sendFile(
      res,
      next,
      () =>
        new ImmichFileResponse({
          path: filePath,
          contentType: 'application/octet-stream',
          cacheControl: CacheControl.None,
          decrypt: identityDecrypt,
        }),
      logger,
    );

    expect(res.statusCode).toBe(200);
    expect(getBody()).toEqual(plaintext);
  });
});
