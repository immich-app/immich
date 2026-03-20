import { CallHandler, ExecutionContext, ForbiddenException, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthRequest } from 'src/middleware/auth.guard';
import { ConfigRepository } from 'src/repositories/config.repository';

const SAFE_POST_PREFIXES = [
  '/api/search/',
  '/api/download/',
  '/api/auth/logout',
  '/api/auth/validateToken',
  '/api/auth/demo-login',
  '/api/auth/change-password',
];

const SAFE_PUT_PREFIXES = ['/api/users/me/preferences', '/api/users/me/onboarding'];

@Injectable()
export class DemoInterceptor implements NestInterceptor {
  constructor(private configRepository: ConfigRepository) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const { demo } = this.configRepository.getEnv();
    if (!demo.enabled) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const userEmail = request.user?.user?.email;
    if (!userEmail || userEmail !== demo.email) {
      return next.handle();
    }

    // Allow all sync endpoints (GET, POST, DELETE) for mobile app
    if (request.path.startsWith('/api/sync/')) {
      return next.handle();
    }

    const method = request.method;
    if (method === 'GET') {
      return next.handle();
    }

    if (method === 'POST' && SAFE_POST_PREFIXES.some((prefix) => request.path.startsWith(prefix))) {
      return next.handle();
    }

    if (method === 'PUT' && SAFE_PUT_PREFIXES.some((prefix) => request.path.startsWith(prefix))) {
      return next.handle();
    }

    throw new ForbiddenException('This action is not available in demo mode');
  }
}
