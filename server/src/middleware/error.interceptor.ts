import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { ImmichLogger } from 'src/utils/logger';
import { isConnectionAborted, routeToErrorMessage } from 'src/utils/misc';

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
