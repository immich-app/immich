import { HttpException } from '@nestjs/common';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { TypeORMError } from 'typeorm';

export const logGlobalError = (logger: ILoggerRepository, error: Error) => {
  if (error instanceof HttpException) {
    const status = error.getStatus();
    const response = error.getResponse();
    logger.debug(`HttpException(${status}): ${JSON.stringify(response)}`);
    return;
  }

  if (error instanceof TypeORMError) {
    logger.error(`Database error: ${error}`);
    return;
  }

  if (error instanceof Error) {
    logger.error(`Unknown error: ${error}`);
    return;
  }
};
