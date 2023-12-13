import { ImmichFileResponse, isConnectionAborted } from '@app/domain';
import { ImmichLogger } from '@app/infra/logger';
import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { access, constants } from 'fs/promises';
import { isAbsolute } from 'path';
import { Observable, mergeMap } from 'rxjs';
import { promisify } from 'util';

type SendFile = Parameters<Response['sendFile']>;
type SendFileOptions = SendFile[1];

export class FileServeInterceptor implements NestInterceptor {
  private logger = new ImmichLogger(FileServeInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const http = context.switchToHttp();
    const res = http.getResponse<Response>();

    const sendFile = (path: string, options: SendFileOptions) =>
      promisify<string, SendFileOptions>(res.sendFile).bind(res)(path, options);

    return next.handle().pipe(
      mergeMap(async (file) => {
        if (file instanceof ImmichFileResponse === false) {
          return file;
        }

        try {
          if (file.cacheControl) {
            res.set('Cache-Control', 'private, max-age=86400, no-transform');
          }

          res.header('Content-Type', file.contentType);

          const options: SendFileOptions = { dotfiles: 'allow' };
          if (!isAbsolute(file.path)) {
            options.root = process.cwd();
          }

          await access(file.path, constants.R_OK);

          return sendFile(file.path, options);
        } catch (error: Error | any) {
          res.header('Cache-Control', 'none');

          if (!isConnectionAborted(error)) {
            this.logger.error(`Unable to send file: ${error.name}`, error.stack);
          }
          // throwing closes the connection and prevents `Error: write EPIPE`
          throw error;
        }
      }),
    );
  }
}
