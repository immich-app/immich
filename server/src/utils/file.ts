import { HttpException, StreamableFile } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { access, constants } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { promisify } from 'node:util';
import { CacheControl } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { ImmichReadStream } from 'src/repositories/storage.repository';
import { isConnectionAborted } from 'src/utils/misc';
import { ConfigRepository } from 'src/repositories/config.repository';
import { S3AppStorageBackend } from 'src/storage/s3-backend';

export function getFileNameWithoutExtension(path: string): string {
  return basename(path, extname(path));
}

export function getFilenameExtension(path: string): string {
  return extname(path);
}

export function getLivePhotoMotionFilename(stillName: string, motionName: string) {
  return getFileNameWithoutExtension(stillName) + extname(motionName);
}

export class ImmichFileResponse {
  public readonly path!: string;
  public readonly contentType!: string;
  public readonly cacheControl!: CacheControl;
  public readonly fileName?: string;

  constructor(response: ImmichFileResponse) {
    Object.assign(this, response);
  }
}
type SendFile = Parameters<Response['sendFile']>;
type SendFileOptions = SendFile[1];

const cacheControlHeaders: Record<CacheControl, string | null> = {
  [CacheControl.PrivateWithCache]: 'private, max-age=86400, no-transform',
  [CacheControl.PrivateWithoutCache]: 'private, no-cache, no-transform',
  [CacheControl.None]: null, // falsy value to prevent adding Cache-Control header
};

export const sendFile = async (
  res: Response,
  next: NextFunction,
  handler: () => Promise<ImmichFileResponse>,
  logger: LoggingRepository,
): Promise<void> => {
  // promisified version of 'res.sendFile' for cleaner async handling
  const _sendFile = (path: string, options: SendFileOptions) =>
    promisify<string, SendFileOptions>(res.sendFile).bind(res)(path, options);

  try {
    const file = await handler();
    const cacheControlHeader = cacheControlHeaders[file.cacheControl];
    if (cacheControlHeader) {
      // set the header to Cache-Control
      res.set('Cache-Control', cacheControlHeader);
    }

    res.header('Content-Type', file.contentType);
    if (file.fileName) {
      res.header('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`);
    }

    // S3 streaming path
    if (file.path.startsWith('s3://')) {
      const env = new ConfigRepository().getEnv();
      const s3c = env.storage.s3;
      if (!s3c || !s3c.bucket) {
        throw new Error('S3 storage not configured');
      }
      const s3 = new S3AppStorageBackend({
        endpoint: s3c.endpoint,
        region: s3c.region || 'us-east-1',
        bucket: s3c.bucket,
        prefix: s3c.prefix,
        forcePathStyle: s3c.forcePathStyle,
        useAccelerate: s3c.useAccelerate,
        accessKeyId: s3c.accessKeyId,
        secretAccessKey: s3c.secretAccessKey,
        sse: s3c.sse as any,
        sseKmsKeyId: s3c.sseKmsKeyId,
      });
      const head = await s3.head(file.path).catch(() => undefined);
      const stream = await s3.readStream(file.path);
      if (head?.size) {
        res.header('Content-Length', String(head.size));
      }
      await new Promise<void>((resolve, reject) => {
        stream.on('error', reject);
        stream.on('end', () => resolve());
        stream.pipe(res);
      });
      return;
    }

    // Local filesystem path
    await access(file.path, constants.R_OK);
    return await _sendFile(file.path, { dotfiles: 'allow' });
  } catch (error: Error | any) {
    // ignore client-closed connection
    if (isConnectionAborted(error) || res.headersSent) {
      return;
    }

    // log non-http errors
    if (error instanceof HttpException === false) {
      logger.error(`Unable to send file: ${error}`, error.stack);
    }

    res.header('Cache-Control', 'none');
    next(error);
  }
};

export const asStreamableFile = ({ stream, type, length }: ImmichReadStream) => {
  return new StreamableFile(stream, { type, length });
};
