import { Injectable } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { AuthService } from 'src/services/auth.service';

@Injectable()
export class ApiService {
  constructor(
    private authService: AuthService,
    private configRepository: ConfigRepository,
    private logger: LoggingRepository,
  ) {
    this.logger.setContext(ApiService.name);
  }

  async onBootstrap(): Promise<void> {
    this.logger.log('API service started');
  }

  ssr(_excludePaths: string[]) {
    return async (request: Request, res: Response, next: NextFunction) => {
      next();
    };
  }
}
