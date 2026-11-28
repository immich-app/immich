import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { parseCookie } from 'cookie';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { clearOAuthLinkCookie, getOAuthLinkCookieName } from 'src/utils/response.js';

@Injectable()
export class OAuthLinkCookieInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    if (!parseCookie(request.headers.cookie || '')[getOAuthLinkCookieName(request.secure)]) {
      return next.handle();
    }

    return next.handle().pipe(tap(() => void clearOAuthLinkCookie(response, request.secure)));
  }
}
