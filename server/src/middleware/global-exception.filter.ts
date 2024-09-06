import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Inject } from '@nestjs/common';
import { Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { logGlobalError } from 'src/utils/logger';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter<Error> {
  constructor(
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
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
