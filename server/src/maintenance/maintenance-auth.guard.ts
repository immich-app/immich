import { CanActivate, ExecutionContext, Injectable, SetMetadata, applyDecorators } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { MaintenanceAuthDto } from 'src/dtos/maintenance.dto';
import { MetadataKey } from 'src/enum';
import { MaintenanceWorkerService } from 'src/maintenance/maintenance-worker.service';
import { LoggingRepository } from 'src/repositories/logging.repository';

export const MaintenanceRoute = (options = {}): MethodDecorator => {
  const decorators: MethodDecorator[] = [SetMetadata(MetadataKey.AuthRoute, options)];
  return applyDecorators(...decorators);
};

export interface MaintenanceAuthRequest extends Request {
  auth?: MaintenanceAuthDto;
}

@Injectable()
export class MaintenanceAuthGuard implements CanActivate {
  constructor(
    private logger: LoggingRepository,
    private reflector: Reflector,
    private service: MaintenanceWorkerService,
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
    request.auth = await this.service.authenticate(request.headers);

    return true;
  }
}
