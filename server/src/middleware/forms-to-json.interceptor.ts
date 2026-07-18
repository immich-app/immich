import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

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
      }
    }

    return next.handle();
  }
}
