import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  applyDecorators,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { parse } from 'cookie';
import { Request } from 'express';
import { MaintenanceAuthDto } from 'src/dtos/maintenance.dto';
import { ImmichCookie, MetadataKey } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MaintenanceWorkerRepository } from 'src/repositories/maintenance-worker.repository';

import * as jwt from 'jsonwebtoken';

export const MaintenanceRoute = (options = {}): MethodDecorator => {
  const decorators: MethodDecorator[] = [SetMetadata(MetadataKey.AuthRoute, options)];
  return applyDecorators(...decorators);
};

export interface MaintenanceAuthRequest extends Request {
  maintenanceAuth?: MaintenanceAuthDto;
}

export interface MaintenanceAuthenticatedRequest extends Request {
  maintenanceAuth: MaintenanceAuthDto;
}

export const MaintenanceAuth = createParamDecorator((data, context: ExecutionContext): MaintenanceAuthDto => {
  return context.switchToHttp().getRequest<MaintenanceAuthenticatedRequest>().maintenanceAuth;
});

@Injectable()
export class MaintenanceAuthGuard implements CanActivate {
  constructor(
    private logger: LoggingRepository,
    private reflector: Reflector,
    private maintenanceWorkerRepository: MaintenanceWorkerRepository,
  ) {
    this.logger.setContext(MaintenanceAuthGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler()];
    const options = this.reflector.getAllAndOverride<{} | undefined>(MetadataKey.AuthRoute, targets);
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<MaintenanceAuthRequest>();
    const jwtToken = parse(request.headers.cookie || '')[ImmichCookie.MaintenanceToken];

    if (!jwtToken) {
      throw new UnauthorizedException('Missing JWT Token');
    }

    try {
      const secret = await this.maintenanceWorkerRepository.maintenanceToken();
      const payload = jwt.verify(jwtToken, secret);
      request['maintenanceAuth'] = payload as MaintenanceAuthDto;
    } catch {
      throw new UnauthorizedException('Invalid JWT Token');
    }

    return true;
  }
}
