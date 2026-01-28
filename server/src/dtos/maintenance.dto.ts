import { ApiProperty } from '@nestjs/swagger';
import { ValidateIf } from 'class-validator';
import { MaintenanceAction, StorageFolder } from 'src/enum';
import { ValidateBoolean, ValidateEnum, ValidateString } from 'src/validation';

export class SetMaintenanceModeDto {
  @ValidateEnum({ enum: MaintenanceAction, name: 'MaintenanceAction', description: 'Maintenance action' })
  action!: MaintenanceAction;

  @ValidateIf((o) => o.action === MaintenanceAction.RestoreDatabase)
  @ValidateString({ description: 'Restore backup filename' })
  restoreBackupFilename?: string;
}

export class MaintenanceLoginDto {
  @ValidateString({ optional: true, description: 'Maintenance token' })
  token?: string;
}

export class MaintenanceAuthDto {
  @ApiProperty({ description: 'Maintenance username' })
  username!: string;
}

export class MaintenanceStatusResponseDto {
  active!: boolean;

  @ValidateEnum({ enum: MaintenanceAction, name: 'MaintenanceAction', description: 'Maintenance action' })
  action!: MaintenanceAction;

  progress?: number;
  task?: string;
  error?: string;
}

export class MaintenanceDetectInstallStorageFolderDto {
  @ValidateEnum({ enum: StorageFolder, name: 'StorageFolder', description: 'Storage folder' })
  folder!: StorageFolder;
  @ValidateBoolean({ description: 'Whether the folder is readable' })
  readable!: boolean;
  @ValidateBoolean({ description: 'Whether the folder is writable' })
  writable!: boolean;
  @ApiProperty({ description: 'Number of files in the folder' })
  files!: number;
}

export class MaintenanceDetectInstallResponseDto {
  storage!: MaintenanceDetectInstallStorageFolderDto[];
}
