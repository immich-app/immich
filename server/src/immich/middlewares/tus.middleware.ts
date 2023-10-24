import { AuthService } from '@app/domain';
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction } from 'express';
import { IncomingMessage, ServerResponse } from 'http';
import { TusService } from '../api-v1/asset/tus.service';

@Injectable()
export class TusMiddleware implements NestMiddleware {
  private logger = new Logger(TusMiddleware.name);
  constructor(
    private tusService: TusService,
    private authService: AuthService,
  ) {}

  async use(req: IncomingMessage, res: ServerResponse<IncomingMessage>, next: NextFunction) {
    // Not sure if this endpoint will have auth information in the query, so let's write it like this
    const query: Record<string, string> = {};
    for (const [name, value] of new URLSearchParams(req.url)) {
      query[name] = value;
    }
    const user = await this.authService.validate(req.headers, query);

    // If the user doesn't exist, simply continue without uploading anything
    if (user == null) {
      next();
      return;
    }

    await this.tusService.handleTus(req, res, user.id);
  }
}
