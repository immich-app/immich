import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ValidateBoolean } from 'src/domain/domain.util';
import { LogLevel } from 'src/infra/entities/system-config.entity';

export class SystemConfigLoggingDto {
  @ValidateBoolean()
  enabled!: boolean;

  @ApiProperty({ enum: LogLevel, enumName: 'LogLevel' })
  @IsEnum(LogLevel)
  level!: LogLevel;
}
