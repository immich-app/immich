import { IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SystemConfigKey } from '@app/database/entities/system-config.entity';

export class SetSystemConfigDto {
  @IsNotEmpty()
  config!: SystemConfigEntry[];
}

export class SystemConfigEntry {
  @IsNotEmpty()
  @IsIn(Object.values(SystemConfigKey))
  @ApiProperty({
    enum: Object.values(SystemConfigKey),
    enumName: 'SystemConfigKey',
  })
  key!: SystemConfigKey;
  value!: string;
}
