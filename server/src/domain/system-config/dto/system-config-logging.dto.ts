import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { LogLevel } from 'src/infra/entities/system-config.entity';
import { ValidateBoolean } from 'src/validation';

export class SystemConfigLoggingDto {
  @ValidateBoolean()
  enabled!: boolean;

  @ApiProperty({ enum: LogLevel, enumName: 'LogLevel' })
  @IsEnum(LogLevel)
  level!: LogLevel;
}
