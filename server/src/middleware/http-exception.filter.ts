import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Inject } from '@nestjs/common';
import { Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { ILoggerRepository } from 'src/interfaces/logger.interface';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
    private cls: ClsService,
  ) {
    this.logger.setContext(HttpExceptionFilter.name);
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    this.logger.debug(`HttpException(${status}) ${JSON.stringify(exception.getResponse())}`);

    let responseBody = exception.getResponse();
    // unclear what circumstances would return a string
    if (typeof responseBody === 'string') {
      responseBody = {
        error: 'Unknown',
        message: responseBody,
        statusCode: status,
      };
    }

    if (!response.headersSent) {
      response.status(status).json({
        ...responseBody,
        correlationId: this.cls.getId(),
      });
    }
  }
}
