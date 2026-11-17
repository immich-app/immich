import { BadRequestException, StandardSchemaValidationPipe } from '@nestjs/common';

export class GlobalValidationPipe extends StandardSchemaValidationPipe {
  constructor() {
    super({ validateCustomDecorators: true, exceptionFactory: toValidationException });
  }
}

const toValidationException = (issues: readonly unknown[]) =>
  new BadRequestException({ message: 'Validation failed', errors: issues });
