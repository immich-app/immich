import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { MaintenanceAction } from 'src/enum';
import { ValidateEnum, ValidateString } from 'src/validation';

@ApiSchema({ description: 'Set maintenance mode request with action' })
export class SetMaintenanceModeDto {
  @ApiProperty({ description: 'Maintenance action', enum: MaintenanceAction })
  @ValidateEnum({ enum: MaintenanceAction, name: 'MaintenanceAction' })
  action!: MaintenanceAction;
}

@ApiSchema({ description: 'Maintenance login request with optional token' })
export class MaintenanceLoginDto {
  @ApiPropertyOptional({ description: 'Maintenance token' })
  @ValidateString({ optional: true })
  token?: string;
}

@ApiSchema({ description: 'Maintenance authentication response with username' })
export class MaintenanceAuthDto {
  @ApiProperty({ description: 'Maintenance username' })
  username!: string;
}
