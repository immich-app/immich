import { HttpException } from '@nestjs/common';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { TypeORMError } from 'typeorm';

type ColorTextFn = (text: string) => string;

const isColorAllowed = () => !process.env.NO_COLOR;
const colorIfAllowed = (colorFn: ColorTextFn) => (text: string) => (isColorAllowed() ? colorFn(text) : text);

export const LogColor = {
  red: colorIfAllowed((text: string) => `\u001B[31m${text}\u001B[39m`),
  green: colorIfAllowed((text: string) => `\u001B[32m${text}\u001B[39m`),
  yellow: colorIfAllowed((text: string) => `\u001B[33m${text}\u001B[39m`),
  blue: colorIfAllowed((text: string) => `\u001B[34m${text}\u001B[39m`),
  magentaBright: colorIfAllowed((text: string) => `\u001B[95m${text}\u001B[39m`),
  cyanBright: colorIfAllowed((text: string) => `\u001B[96m${text}\u001B[39m`),
};

export const LogStyle = {
  bold: colorIfAllowed((text: string) => `\u001B[1m${text}\u001B[0m`),
};

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
