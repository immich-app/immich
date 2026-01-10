import { ValidateIf } from 'class-validator';
import { MaintenanceAction, StorageFolder } from 'src/enum';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { ValidateEnum, ValidateString } from 'src/validation';

@ApiSchema({ description: 'Set maintenance mode request with action' })
export class SetMaintenanceModeDto {
  @ApiProperty({ description: 'Maintenance action', enum: MaintenanceAction })
  @ValidateEnum({ enum: MaintenanceAction, name: 'MaintenanceAction' })
  action!: MaintenanceAction;

  @ValidateIf((o) => o.action === MaintenanceAction.RestoreDatabase)
  @ValidateString()
  restoreBackupFilename?: string;
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

export class MaintenanceStatusResponseDto {
  active!: boolean;

  @ValidateEnum({ enum: MaintenanceAction, name: 'MaintenanceAction' })
  action!: MaintenanceAction;

  progress?: number;
  task?: string;
  error?: string;
}

export class MaintenanceDetectInstallStorageFolderDto {
  @ValidateEnum({ enum: StorageFolder, name: 'StorageFolder' })
  folder!: StorageFolder;
  readable!: boolean;
  writable!: boolean;
  files!: number;
}

export class MaintenanceDetectInstallResponseDto {
  storage!: MaintenanceDetectInstallStorageFolderDto[];
}
