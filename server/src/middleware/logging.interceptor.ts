import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, finalize } from 'rxjs';
import { ILoggerRepository } from 'src/interfaces/logger.interface';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(@Inject(ILoggerRepository) private logger: ILoggerRepository) {
    this.logger.setContext(LoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const handler = context.switchToHttp();
    const req = handler.getRequest();
    const res = handler.getResponse();

    const { method, ip, path } = req;

    const start = performance.now();
    return next.handle().pipe(
      finalize(() => {
        const finish = performance.now();
        const duration = (finish - start).toFixed(2);
        const { statusCode } = res;
        this.logger.verbose(`${method} ${path} ${statusCode} ${duration}ms ${ip}`);
      }),
    );
  }
}
