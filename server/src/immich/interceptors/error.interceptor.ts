import { ImmichLogger } from '@app/infra/logger';
import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { isConnectionAborted } from '../../domain';
import { routeToErrorMessage } from '../app.utils';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  private logger = new ImmichLogger(ErrorInterceptor.name);

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
