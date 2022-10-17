import { IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AdminConfigKey } from '@app/database/entities/admin-config.entity';

export class SetAdminConfigDto {
  @IsNotEmpty()
  config!: AdminConfigEntry[];
}

export class AdminConfigEntry {
  @IsNotEmpty()
  @IsIn(Object.values(AdminConfigKey))
  @ApiProperty({
    enum: Object.values(AdminConfigKey),
    enumName: 'AdminConfigKey',
  })
  key!: AdminConfigKey;
  value!: string;
}
