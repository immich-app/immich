import { applyDecorators, UsePipes, ValidationPipe } from '@nestjs/common';

export function UseValidation() {
  return applyDecorators(
    UsePipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    ),
  );
}
