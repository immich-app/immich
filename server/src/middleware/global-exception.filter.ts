import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { ZodSerializationException, ZodValidationException } from 'nestjs-zod';
import { ImmichHeader } from 'src/enum';
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
    this.handleError(host.switchToHttp().getResponse<Response>(), error);
  }

  handleError(res: Response, error: Error) {
    const { status, body } = this.fromError(error);
    if (!res.headersSent) {
      res.header(ImmichHeader.CorrelationId, this.cls.getId()).status(status).json(body);
    }
  }

  private fromError(error: Error) {
    logGlobalError(this.logger, error);

    if (error instanceof HttpException) {
      const status = error.getStatus();
      const response = error.getResponse();
      const body: Record<string, unknown> =
        typeof response === 'string' ? { message: response } : { ...(response as object) };

      // handle both request and response validation errors
      if (error instanceof ZodValidationException || error instanceof ZodSerializationException) {
        const zodError = error.getZodError();
        if (zodError instanceof ZodError && zodError.issues.length > 0) {
          return {
            status,
            body: { message: 'Validation failed', errors: zodError.issues },
          };
        }
      }

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
