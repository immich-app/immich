import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { ZodSerializationException, ZodValidationException } from 'nestjs-zod';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { logGlobalError } from 'src/utils/logger';
import { ZodError } from 'zod';

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

  handleError(res: Response, error: Error) {
    const { status, body } = this.fromError(error);
    if (!res.headersSent) {
      res.status(status).json({ ...body, statusCode: status, correlationId: this.cls.getId() });
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

      // handle both request and response validation errors
      if (error instanceof ZodValidationException || error instanceof ZodSerializationException) {
        const zodError = error.getZodError();
        if (zodError instanceof ZodError && zodError.issues.length > 0) {
          body = {
            message: zodError.issues.map((issue) => issue.message),
            // technically more accurate to return 422 Unprocessable Entity here
            // nestjs-zod uses 400 Bad Request and we use 400 in v2
            // https://github.com/BenLorantfy/nestjs-zod/issues/328
            error: 'Bad Request',
          };
        }
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
