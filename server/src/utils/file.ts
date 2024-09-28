import { HttpException, StreamableFile } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { access, constants } from 'node:fs/promises';
import { basename, extname, isAbsolute } from 'node:path';
import { promisify } from 'node:util';
import { CacheControl } from 'src/enum';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { ImmichReadStream } from 'src/interfaces/storage.interface';
import { isConnectionAborted } from 'src/utils/misc';

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

  constructor(response: ImmichFileResponse) {
    Object.assign(this, response);
  }
}
type SendFile = Parameters<Response['sendFile']>;
type SendFileOptions = SendFile[1];

export const sendFile = async (
  res: Response,
  next: NextFunction,
  handler: () => Promise<ImmichFileResponse>,
  logger: ILoggerRepository,
): Promise<void> => {
  const _sendFile = (path: string, options: SendFileOptions) =>
    promisify<string, SendFileOptions>(res.sendFile).bind(res)(path, options);

  try {
    const file = await handler();
    switch (file.cacheControl) {
      case CacheControl.PRIVATE_WITH_CACHE: {
        res.set('Cache-Control', 'private, max-age=86400, no-transform');
        break;
      }

      case CacheControl.PRIVATE_WITHOUT_CACHE: {
        res.set('Cache-Control', 'private, no-cache, no-transform');
        break;
      }
    }

    res.header('Content-Type', file.contentType);

    const options: SendFileOptions = { dotfiles: 'allow' };
    if (!isAbsolute(file.path)) {
      options.root = process.cwd();
    }

    await access(file.path, constants.R_OK);

    return await _sendFile(file.path, options);
  } catch (error: Error | any) {
    // ignore client-closed connection
    if (isConnectionAborted(error) || res.headersSent) {
      return;
    }

    // log non-http errors
    if (error instanceof HttpException === false) {
      logger.error(`Unable to send file: ${error.name}`, error.stack);
    }

    res.header('Cache-Control', 'none');
    next(error);
  }
};

export const asStreamableFile = ({ stream, type, length }: ImmichReadStream) => {
  return new StreamableFile(stream, { type, length });
};
