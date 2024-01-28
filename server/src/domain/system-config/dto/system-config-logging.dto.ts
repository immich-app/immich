import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum } from 'class-validator';
import { LogLevel } from 'src/infra/entities';

export class SystemConfigLoggingDto {
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty({ enum: LogLevel, enumName: 'LogLevel' })
  @IsEnum(LogLevel)
  level!: LogLevel;
}
