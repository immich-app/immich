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
import { logGlobalError } from 'src/utils/logger';
import { routeToErrorMessage } from 'src/utils/misc';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  constructor(@Inject(ILoggerRepository) private logger: ILoggerRepository) {
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

          const message = routeToErrorMessage(context.getHandler().name);
          return new InternalServerErrorException(message);
        }),
      ),
    );
  }
}
