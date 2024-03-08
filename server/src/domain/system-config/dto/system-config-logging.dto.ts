import { LogLevel } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ValidateBoolean } from '../../domain.util';

export class SystemConfigLoggingDto {
  @ValidateBoolean()
  enabled!: boolean;

  @ApiProperty({ enum: LogLevel, enumName: 'LogLevel' })
  @IsEnum(LogLevel)
  level!: LogLevel;
}
