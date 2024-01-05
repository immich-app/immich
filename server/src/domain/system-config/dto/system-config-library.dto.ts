import { validateCronExpression } from '@app/domain';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsString,
  Validate,
  ValidateIf,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

const isEnabled = (config: SystemConfigLibraryScanDto) => config.enabled;

@ValidatorConstraint({ name: 'cronValidator' })
class CronValidator implements ValidatorConstraintInterface {
  validate(expression: string): boolean {
    return validateCronExpression(expression);
  }
}

export class SystemConfigLibraryScanDto {
  @IsBoolean()
  enabled!: boolean;

  @ValidateIf(isEnabled)
  @IsNotEmpty()
  @Validate(CronValidator, { message: 'Invalid cron expression' })
  @IsString()
  cronExpression!: string;
}

export class SystemConfigLibraryWatchDto {
  @IsBoolean()
  enabled!: boolean;
}

export class SystemConfigLibraryDto {
  @Type(() => SystemConfigLibraryScanDto)
  @ValidateNested()
  @IsObject()
  scan!: SystemConfigLibraryScanDto;

  @Type(() => SystemConfigLibraryWatchDto)
  @ValidateNested()
  @IsObject()
  watch!: SystemConfigLibraryWatchDto;
}
