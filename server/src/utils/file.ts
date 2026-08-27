import { HttpException, NotFoundException, StreamableFile } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { createReadStream } from 'node:fs';
import { access, constants, stat } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { Readable, Transform, TransformCallback } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { promisify } from 'node:util';
import { CacheControl } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { ImmichReadStream } from 'src/repositories/storage.repository';
import { isConnectionAborted } from 'src/utils/misc';

export function getFileNameWithoutExtension(path: string): string {
  return basename(path, getFilenameExtension(path));
}

export function getFilenameExtension(path: string) {
  const extension = extname(path);
  if (!extension && path.startsWith('.') && !path.includes('.', 1)) {
    return path;
  }
  return extension;
}

export function getLivePhotoMotionFilename(stillName: string, motionName: string) {
  return getFileNameWithoutExtension(stillName) + getFilenameExtension(motionName);
}

export class ImmichFileResponse {
  public readonly path!: string;
  public readonly contentType!: string;
  public readonly cacheControl!: CacheControl;
  public readonly fileName?: string;
  /**
   * When set, `path` on disk holds ciphertext rather than the real file: `sendFile` pipes the raw bytes through
   * this transform instead of delegating to `res.sendFile`. `sendFile` still honors `Range` requests for these
   * responses (see `sendFileWithDecrypt`), but since AES-256-GCM's auth tag covers the whole ciphertext, every
   * Range request re-decrypts the entire file from the start and just discards bytes outside the requested
   * window — there's no way to verify/decrypt a sub-range in isolation. Fine for a single-viewer local feature,
   * but means seeking within a large encrypted video is CPU-heavier than normal, unencrypted playback.
   */
  public readonly decrypt?: (cipherStream: Readable) => Readable;

  constructor(response: ImmichFileResponse) {
    Object.assign(this, response);
  }
}
type SendFile = Parameters<Response['sendFile']>;
type SendFileOptions = SendFile[1];

const cacheControlHeaders: Record<CacheControl, string | null> = {
  [CacheControl.PrivateWithCache]:
    'private, max-age=86400, no-transform, stale-while-revalidate=2592000, stale-if-error=2592000',
  [CacheControl.PrivateWithoutCache]: 'private, no-cache, no-transform',
  [CacheControl.None]: null, // falsy value to prevent adding Cache-Control header
};

/** Forwards only bytes within the inclusive [start, end] window of the input stream, dropping the rest. Used to
 * serve a `Range` request out of a fully-decrypted plaintext stream — see `sendFileWithDecrypt`. */
class ByteRangeTransform extends Transform {
  private position = 0;

  constructor(
    private readonly rangeStart: number,
    private readonly rangeEnd: number,
  ) {
    super();
  }

  override _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback) {
    const chunkStart = this.position;
    const chunkEnd = this.position + chunk.length - 1;
    this.position += chunk.length;

    if (chunkEnd < this.rangeStart || chunkStart > this.rangeEnd) {
      callback();
      return;
    }

    const sliceStart = Math.max(0, this.rangeStart - chunkStart);
    const sliceEnd = Math.min(chunk.length - 1, this.rangeEnd - chunkStart);
    callback(null, chunk.subarray(sliceStart, sliceEnd + 1));
  }
}

/** Parses a single-range `Range: bytes=...` header value against a known total `size`. Returns `null` if the
 * header is missing, malformed, or requests multiple ranges (not supported here). Returns `'unsatisfiable'` if
 * it parses but the range is out of bounds (caller should respond `416`). */
function parseByteRange(
  rangeHeader: string | undefined,
  size: number,
): 'unsatisfiable' | { start: number; end: number } | null {
  if (!rangeHeader) {
    return null;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) {
    // malformed, or a multi-range request (e.g. "bytes=0-10,20-30") — not supported, fall back to a full response
    return null;
  }

  const [, startText, endText] = match;
  if (startText === '' && endText === '') {
    return null;
  }

  let start: number;
  let end: number;
  if (startText === '') {
    // suffix range, e.g. "bytes=-500" means the last 500 bytes
    const suffixLength = Number(endText);
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(startText);
    end = endText === '' ? size - 1 : Number(endText);
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start < 0 || start >= size) {
    return 'unsatisfiable';
  }

  return { start, end: Math.min(end, size - 1) };
}

/** Streams a decrypted file to `res`, honoring a single-range `Range` header if present. See
 * `ImmichFileResponse.decrypt` for why every Range request re-decrypts the file from the start. */
async function sendFileWithDecrypt(res: Response, file: ImmichFileResponse) {
  const decrypt = file.decrypt!;
  const { size } = await stat(file.path);

  res.header('Accept-Ranges', 'bytes');

  const range = parseByteRange(res.req.headers.range, size);
  if (range === 'unsatisfiable') {
    res.header('Content-Range', `bytes */${size}`);
    res.status(416);
    res.end();
    return;
  }

  if (range) {
    res.status(206);
    res.header('Content-Range', `bytes ${range.start}-${range.end}/${size}`);
    res.header('Content-Length', String(range.end - range.start + 1));
    await pipeline(decrypt(createReadStream(file.path)), new ByteRangeTransform(range.start, range.end), res);
    return;
  }

  res.header('Content-Length', String(size));
  await pipeline(decrypt(createReadStream(file.path)), res);
}

export const sendFile = async (
  res: Response,
  next: NextFunction,
  handler: () => Promise<ImmichFileResponse> | ImmichFileResponse,
  logger: LoggingRepository,
): Promise<void> => {
  // promisified version of 'res.sendFile' for cleaner async handling
  const _sendFile = (path: string, options: SendFileOptions) =>
    promisify<string, SendFileOptions>(res.sendFile).bind(res)(path, options);

  try {
    const file = await handler();

    await access(file.path, constants.R_OK);

    const cacheControlHeader = cacheControlHeaders[file.cacheControl];
    if (cacheControlHeader) {
      // set the header to Cache-Control
      res.set('Cache-Control', cacheControlHeader);
    }

    res.header('Content-Type', file.contentType);
    if (file.fileName) {
      res.header('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`);
    }

    if (file.decrypt) {
      await sendFileWithDecrypt(res, file);
      return;
    }

    return await _sendFile(file.path, { dotfiles: 'allow' });
  } catch (error: Error | any) {
    // ignore client-closed connection
    if (isConnectionAborted(error) || res.headersSent) {
      return;
    }

    // log non-http errors
    if (!(error instanceof HttpException)) {
      logger.error(`Unable to send file: ${error}`, error.stack);
    }

    next(new NotFoundException());
  }
};

export const asStreamableFile = ({ stream, type, disposition, length }: ImmichReadStream) => {
  return new StreamableFile(stream, { type, disposition, length });
};
