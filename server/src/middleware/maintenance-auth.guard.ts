import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  applyDecorators,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { MaintenanceAuthDto } from 'src/dtos/maintenance.dto';
import { MetadataKey } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MaintenanceWorkerRepository } from 'src/repositories/maintenance-worker.repository';

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
    const options = this.reflector.getAllAndOverride<{ _emptyObject: never } | undefined>(
      MetadataKey.AuthRoute,
      targets,
    );
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<MaintenanceAuthRequest>();
    request['maintenanceAuth'] = await this.maintenanceWorkerRepository.authenticate(request.headers);

    return true;
  }
}
