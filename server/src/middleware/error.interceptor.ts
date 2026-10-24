import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { Observable, catchError, throwError } from 'rxjs';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { isHttpException, onRouteError } from 'src/utils/logger.js';
import { routeToErrorMessage } from 'src/utils/misc.js';
import { isPrivateRequest } from 'src/utils/private-request.js';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  constructor(
    private logger: LoggingRepository,
    private reflector: Reflector,
  ) {
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

          if (isPrivateRequest(this.reflector, context)) {
            // Unknown errors (including driver errors) may contain private values.
            this.logger.error('Unknown error on private request');
          } else {
            onRouteError(req, res, error, this.logger);
          }

          const message = routeToErrorMessage(context.getHandler().name);
          return new InternalServerErrorException(message);
        }),
      ),
    );
  }
}
