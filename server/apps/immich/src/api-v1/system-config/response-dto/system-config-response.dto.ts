import { SystemConfigKey, SystemConfigValue } from '@app/database/entities/system-config.entity';
import { ApiProperty } from '@nestjs/swagger';

export class SystemConfigResponseDto {
  config!: SystemConfigResponseItem[];
}

export class SystemConfigResponseItem {
  @ApiProperty({ type: 'string' })
  name!: string;

  @ApiProperty({ enumName: 'SystemConfigKey', enum: SystemConfigKey })
  key!: SystemConfigKey;

  @ApiProperty({ type: 'string' })
  value!: SystemConfigValue;

  @ApiProperty({ type: 'string' })
  defaultValue!: SystemConfigValue;
}
