import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { GqlContextType } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { ClsService } from 'nestjs-cls';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { logGlobalError } from 'src/utils/logger';
import { getReqRes } from 'src/utils/request';

type StructuredError = {
  status: number;
  body: {
    [key: string]: unknown;
    message?: string;
  };
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter<Error> {
  constructor(
    private logger: LoggingRepository,
    private cls: ClsService,
  ) {
    this.logger.setContext(GlobalExceptionFilter.name);
  }

  catch(error: Error, host: ArgumentsHost) {
    const { res } = getReqRes(host);
    const { status, body } = this.fromError(error);
    const message = { ...body, statusCode: status, correlationId: this.cls.getId() };

    if (host.getType<GqlContextType>() === 'graphql') {
      throw new GraphQLError(body?.message || 'Error', { extensions: message });
    }

    if (!res.headersSent) {
      res.status(status).json(message);
    }
  }

  private fromError(error: Error): StructuredError {
    logGlobalError(this.logger, error);

    if (error instanceof HttpException) {
      const status = error.getStatus();
      let body = error.getResponse();

      // unclear what circumstances would return a string
      if (typeof body === 'string') {
        body = { message: body };
      }

      return { status, body } as StructuredError;
    }

    return {
      status: 500,
      body: {
        message: 'Internal server error',
      },
    };
  }
}
