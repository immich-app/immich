import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { ImmichHeader } from 'src/enum.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { isHttpException, onRouteError } from 'src/utils/logger.js';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter<Error> {
  constructor(
    private logger: LoggingRepository,
    private cls: ClsService,
  ) {
    this.logger.setContext(GlobalExceptionFilter.name);
  }

  catch(error: Error, host: ArgumentsHost) {
    const http = host.switchToHttp();
    this.handleError(http.getRequest<Request>(), http.getResponse<Response>(), error);
  }

  handleError(req: Request, res: Response, error: Error) {
    const { canWrite } = onRouteError(req, res, error, this.logger);
    if (!canWrite) {
      return;
    }

    const { status, body } = this.fromError(error);

    res
      .header({
        [ImmichHeader.CorrelationId]: this.cls.getId(),
        'Content-Type': 'application/json',
      })
      .status(status)
      .json(body);
  }

  private fromError(error: Error) {
    if (isHttpException(error)) {
      const status = error.getStatus();
      const response = error.getResponse();
      const body: Record<string, unknown> =
        typeof response === 'string' ? { message: response } : { ...(response as object) };

      // remove fields injected by NestJS that duplicate the HTTP response line
      delete body['error'];
      delete body['statusCode'];
      return { status, body };
    }

    return {
      status: 500,
      body: {
        message: 'Internal server error',
      },
    };
  }
}
