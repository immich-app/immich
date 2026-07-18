import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class FormsToJsonInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();

    const contentType = req.headers['content-type'];
    if (contentType?.startsWith('application/x-www-form-urlencoded')) {
      try {
        req.body = JSON.parse(req?.body?.json);
        req.headers['content-type'] = 'application/json';
      } catch {
        // ignore if failed to parse
      }
    }

    return next.handle();
  }
}
