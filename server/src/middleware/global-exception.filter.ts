import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { logGlobalError } from 'src/utils/logger';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter<Error> {
  constructor(
    private logger: LoggingRepository,
    private cls: ClsService,
  ) {
    this.logger.setContext(GlobalExceptionFilter.name);
  }

  catch(error: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const { status, body } = this.fromError(error);
    if (!response.headersSent) {
      response.status(status).json({ ...body, statusCode: status, correlationId: this.cls.getId() });
    }
  }

  private fromError(error: Error) {
    logGlobalError(this.logger, error);

    if (error instanceof HttpException) {
      const status = error.getStatus();
      let body = error.getResponse();

      // unclear what circumstances would return a string
      if (typeof body === 'string') {
        body = { message: body };
      }

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
