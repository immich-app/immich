import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { contextBase, core } from '@opentelemetry/sdk-node';
import { Request } from 'express';
import { Observable } from 'rxjs';

/** Labels HTTP metrics with the matched route template (e.g. `/api/albums/:id`). */
@Injectable()
export class HttpRouteInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const rpcMetadata = core.getRPCMetadata(contextBase.context.active());
    if (rpcMetadata?.type === core.RPCType.HTTP) {
      rpcMetadata.route = context.switchToHttp().getRequest<Request>().route?.path;
    }

    return next.handle();
  }
}
