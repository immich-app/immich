import { HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggingRepository } from 'src/repositories/logging.repository.js';

const isRequestAborted = (request: Request) => request.destroyed && !request.complete;
export const isHttpException = (error: Error): error is HttpException => error instanceof HttpException;
export const isConnectionAbortedError = (error: Error | any) => error.code === 'ECONNABORTED';

export const onRouteError = (req: Request | undefined, res: Response, error: Error, logger: LoggingRepository) => {
  // ignore client-closed connection
  if (res.headersSent || isConnectionAbortedError(error) || (req && isRequestAborted(req))) {
    logger.debug(`Client aborted request: ${error}`);
    return { canWrite: false };
  }

  if (isHttpException(error)) {
    const status = error.getStatus();
    const response = error.getResponse();
    logger.debug(`HttpException(${status}): ${JSON.stringify(response)}`);
    return { canWrite: true };
  }

  if (error instanceof Error) {
    logger.error(`Unknown error: ${error}`, error?.stack);
    return { canWrite: true };
  }

  return { canWrite: true };
};
