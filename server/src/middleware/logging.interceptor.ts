import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { Observable, finalize } from 'rxjs';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { PrivateRequest } from 'src/utils/private-request.js';

const maxArrayLength = 100;
const replacer = (key: string, value: unknown) => {
  if (key.toLowerCase().includes('password') || key.toLowerCase().includes('pincode')) {
    return '********';
  }

  if (Array.isArray(value) && value.length > maxArrayLength) {
    return [...value.slice(0, maxArrayLength), `...and ${value.length - maxArrayLength} more`];
  }

  return value;
};

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private logger: LoggingRepository,
    private reflector: Reflector,
  ) {
    this.logger.setContext(LoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const handler = context.switchToHttp();
    const req = handler.getRequest<Request>();
    const res = handler.getResponse<Response>();

    const { method, ip, url } = req;
    const isPrivate = this.reflector.getAllAndOverride(PrivateRequest, [context.getHandler(), context.getClass()]);
    if (isPrivate) {
      // Set before pipes/controller execution so validation and service errors
      // are also non-cacheable. Never log names, IDs, query strings or bodies.
      res.setHeader('Cache-Control', 'no-store');
    }

    const start = performance.now();

    return next.handle().pipe(
      finalize(() => {
        const finish = performance.now();
        const duration = (finish - start).toFixed(2);
        const { statusCode } = res;

        this.logger.debug(`${method} ${isPrivate ? '[private request]' : url} ${statusCode} ${duration}ms ${ip}`);
        if (!isPrivate && req.body && Object.keys(req.body).length > 0) {
          this.logger.verbose(JSON.stringify(req.body, replacer));
        }
      }),
    );
  }
}
