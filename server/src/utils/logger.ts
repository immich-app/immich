import { HttpException } from '@nestjs/common';
import { Request } from 'express';
import { LoggingRepository } from 'src/repositories/logging.repository';

const isRequestAborted = (request: Request) => request.destroyed && !request.complete;
export const isHttpException = (error: Error): error is HttpException => error instanceof HttpException;

export const onRequestError = (req: Request, error: Error, logger: LoggingRepository) => {
  if (isHttpException(error)) {
    const status = error.getStatus();
    const response = error.getResponse();
    logger.debug(`HttpException(${status}): ${JSON.stringify(response)}`);
    return;
  }

  if (isRequestAborted(req)) {
    logger.debug(`Client aborted request: ${error}`);
    return;
  }

  if (error instanceof Error) {
    logger.error(`Unknown error: ${error}`, error?.stack);
    return;
  }
};
