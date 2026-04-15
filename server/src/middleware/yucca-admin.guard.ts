import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthRequest } from 'src/middleware/auth.guard';
import { AuthService } from 'src/services/auth.service';

@Injectable()
export class YuccaAdminGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    if (!request.path.startsWith('/api/yucca')) {
      return true;
    }

    request.user = await this.authService.authenticate({
      headers: request.headers,
      queryParams: request.query as Record<string, string>,
      metadata: { adminRoute: true, sharedLinkRoute: false, uri: request.path },
    });

    return true;
  }
}
