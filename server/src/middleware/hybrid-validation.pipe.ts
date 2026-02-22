import { ArgumentMetadata, Injectable, PipeTransform, ValidationPipe } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { isZodDto } from 'nestjs-zod/dto';

@Injectable()
export class HybridValidationPipe implements PipeTransform {
  private readonly zodPipe = new ZodValidationPipe();
  private readonly validationPipe = new ValidationPipe({ transform: true, whitelist: true });

  transform(value: unknown, metadata: ArgumentMetadata) {
    const zodValue = this.zodPipe.transform(value, metadata);
    if (metadata.metatype && isZodDto(metadata.metatype)) {
      return Object.assign(Object.create(metadata.metatype.prototype), zodValue);
    }
    return this.validationPipe.transform(zodValue, metadata);
  }
}
