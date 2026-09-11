import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, catchError, throwError } from 'rxjs';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { isHttpException, onRouteError } from 'src/utils/logger.js';
import { routeToErrorMessage } from 'src/utils/misc.js';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  constructor(private logger: LoggingRepository) {
    this.logger.setContext(ErrorInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      catchError((error) =>
        throwError(() => {
          if (isHttpException(error)) {
            return error;
          }

          onRouteError(req, res, error, this.logger);

          const message = routeToErrorMessage(context.getHandler().name);
          return new InternalServerErrorException(message);
        }),
      ),
    );
  }
}
