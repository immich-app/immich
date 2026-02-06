import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { LoggingRepository } from 'src/repositories/logging.repository';
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

          this.logger.error(`Error in handler: ${error}`, error instanceof Error ? error.stack : undefined);

          const message = routeToErrorMessage(context.getHandler().name);
          return new InternalServerErrorException(message);
        }),
      ),
    );
  }
}
