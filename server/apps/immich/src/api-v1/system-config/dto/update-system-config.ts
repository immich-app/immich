import { SystemConfigKey, SystemConfigValue } from '@app/database/entities/system-config.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, ValidateNested } from 'class-validator';

export class UpdateSystemConfigDto {
  @IsNotEmpty()
  @ValidateNested({ each: true })
  config!: SystemConfigItem[];
}

export class SystemConfigItem {
  @IsNotEmpty()
  @IsEnum(SystemConfigKey)
  @ApiProperty({
    enum: SystemConfigKey,
    enumName: 'SystemConfigKey',
  })
  key!: SystemConfigKey;
  value!: SystemConfigValue;
}
