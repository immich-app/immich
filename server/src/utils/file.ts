import { HttpException, StreamableFile } from '@nestjs/common';
import { context, SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import { NextFunction, Response } from 'express';
import { access, constants, stat } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { PassThrough } from 'node:stream';
import { promisify } from 'node:util';
import { CacheControl } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { ImmichReadStream } from 'src/repositories/storage.repository';
import { isConnectionAborted } from 'src/utils/misc';

const fileTracer = trace.getTracer('immich-file');

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
  handler: () => Promise<ImmichFileResponse> | ImmichFileResponse,
  logger: LoggingRepository,
): Promise<void> => {
  // promisified version of 'res.sendFile' for cleaner async handling
  const _sendFile = (path: string, options: SendFileOptions) =>
    promisify<string, SendFileOptions>(res.sendFile).bind(res)(path, options);

  const span = fileTracer.startSpan('file.send', { kind: SpanKind.INTERNAL }, context.active());

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

    await access(file.path, constants.R_OK);

    // Get file size for telemetry
    const fileStats = await stat(file.path);

    span.setAttribute('file.path', file.path);
    span.setAttribute('file.size', fileStats.size);
    span.setAttribute('file.content_type', file.contentType);
    span.setAttribute('file.name', file.fileName || basename(file.path));
    span.setStatus({ code: SpanStatusCode.OK });

    const result = await _sendFile(file.path, { dotfiles: 'allow' });
    span.end();
    return result;
  } catch (error: Error | any) {
    // ignore client-closed connection
    if (isConnectionAborted(error) || res.headersSent) {
      span.setAttribute('file.connection_aborted', true);
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      return;
    }

    // log non-http errors
    if (error instanceof HttpException === false) {
      logger.error(`Unable to send file: ${error}`, error.stack);
    }

    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    if (error instanceof Error) {
      span.recordException(error);
    }
    span.end();

    res.header('Cache-Control', 'none');
    next(error);
  }
};

export const asStreamableFile = ({ stream, type, length }: ImmichReadStream) => {
  const span = fileTracer.startSpan('file.stream', { kind: SpanKind.INTERNAL }, context.active());

  if (length !== undefined) {
    span.setAttribute('file.size', length);
  }
  if (type) {
    span.setAttribute('file.content_type', type);
  }

  let bytesStreamed = 0;

  const trackedStream = new PassThrough();
  trackedStream.on('data', (chunk: Buffer) => {
    bytesStreamed += chunk.length;
  });
  trackedStream.on('end', () => {
    span.setAttribute('file.bytes_streamed', bytesStreamed);
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
  });
  trackedStream.on('error', (error: Error) => {
    span.setAttribute('file.bytes_streamed', bytesStreamed);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    span.recordException(error);
    span.end();
  });

  stream.pipe(trackedStream);

  return new StreamableFile(trackedStream, { type, length });
};
