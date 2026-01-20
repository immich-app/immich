import { ValidateIf } from 'class-validator';
import { MaintenanceAction, StorageFolder } from 'src/enum';
import { ValidateEnum, ValidateString } from 'src/validation';

export class SetMaintenanceModeDto {
  @ValidateEnum({ enum: MaintenanceAction, name: 'MaintenanceAction' })
  action!: MaintenanceAction;

  @ValidateIf((o) => o.action === MaintenanceAction.RestoreDatabase)
  @ValidateString()
  restoreBackupFilename?: string;
}

export class MaintenanceLoginDto {
  @ValidateString({ optional: true })
  token?: string;
}

export class MaintenanceAuthDto {
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
