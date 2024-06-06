import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, finalize } from 'rxjs';
import { ILoggerRepository } from 'src/interfaces/logger.interface';

const maxArrayLength = 100;
const replacer = (key: string, value: unknown) => {
  if (key.toLowerCase().includes('password')) {
    return '********';
  }

  if (Array.isArray(value) && value.length > maxArrayLength) {
    return [...value.slice(0, maxArrayLength), `...and ${value.length - maxArrayLength} more`];
  }

  return value;
};

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(@Inject(ILoggerRepository) private logger: ILoggerRepository) {
    this.logger.setContext(LoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const handler = context.switchToHttp();
    const req = handler.getRequest<Request>();
    const res = handler.getResponse<Response>();

    const { method, ip, url } = req;

    const start = performance.now();

    return next.handle().pipe(
      finalize(() => {
        const finish = performance.now();
        const duration = (finish - start).toFixed(2);
        const { statusCode } = res;

        this.logger.debug(`${method} ${url} ${statusCode} ${duration}ms ${ip}`);
        if (req.body && Object.keys(req.body).length > 0) {
          this.logger.verbose(JSON.stringify(req.body, replacer));
        }
      }),
    );
  }
}
