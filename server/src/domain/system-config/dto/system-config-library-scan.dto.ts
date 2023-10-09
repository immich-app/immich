import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  Validate,
  ValidateIf,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { CronJob } from 'cron';

const isEnabled = (config: SystemConfigLibraryScanDto) => config.enabled;

@ValidatorConstraint({ name: 'cronValidator' })
class CronValidator implements ValidatorConstraintInterface {
  validate(expression: string): boolean {
    try {
      new CronJob(expression, () => {});
    } catch (error) {
      return false;
    }

    return true;
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
