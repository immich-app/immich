import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { logGlobalError } from 'src/utils/logger';
import { routeToErrorMessage } from 'src/utils/misc';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  constructor(private logger: LoggingRepository) {
    this.logger.setContext(ErrorInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    return next.handle().pipe(
      catchError((error) =>
        throwError(() => {
          if (error instanceof HttpException) {
            return error;
          }

          logGlobalError(this.logger, error);

          // Handle storage errors as client errors (disk full / quota exceeded / storage unavailable)
          const { code, errno } = error as NodeJS.ErrnoException;
          if (code === 'ENOSPC' || code === 'ENOENT' || code === 'EDQUOT' || errno === -122) {
            return new BadRequestException('Not enough storage');
          }

          const message = routeToErrorMessage(context.getHandler().name);
          return new InternalServerErrorException(message);
        }),
      ),
    );
  }
}
