import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { isConnectionAborted, routeToErrorMessage } from 'src/utils/misc';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  constructor(@Inject(ILoggerRepository) private logger: ILoggerRepository) {
    this.logger.setContext(ErrorInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    return next.handle().pipe(
      catchError((error) =>
        throwError(() => {
          if (error instanceof HttpException === false) {
            const errorMessage = routeToErrorMessage(context.getHandler().name);
            if (!isConnectionAborted(error)) {
              this.logger.error(errorMessage, error, error?.errors, error?.stack);
            }
            return new InternalServerErrorException(errorMessage);
          } else {
            return error;
          }
        }),
      ),
    );
  }
}
