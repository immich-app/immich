import { ValidateIf } from 'class-validator';
import { MaintenanceAction, StorageFolder } from 'src/enum';
import { ValidateEnum, ValidateString } from 'src/validation';
import { ApiProperty } from '@nestjs/swagger';

export class SetMaintenanceModeDto {
  @ValidateEnum({ enum: MaintenanceAction, name: 'MaintenanceAction' })
  action!: MaintenanceAction;

  @ValidateIf((o) => o.action === MaintenanceAction.RestoreDatabase)
  @ValidateString()
  @ApiProperty({ description: 'The filename of the backup to restore' })
  restoreBackupFilename?: string;
}

export class MaintenanceLoginDto {
  @ValidateString({ optional: true })
  @ApiProperty({ description: 'The maintenance token' })
  token?: string;
}

export class MaintenanceAuthDto {
  @ApiProperty({ description: 'The username to login with' })
  username!: string;
}

export class MaintenanceStatusResponseDto {
  @ApiProperty({ description: 'Whether maintenance mode is active' })
  active!: boolean;

  @ValidateEnum({ enum: MaintenanceAction, name: 'MaintenanceAction' })
  action!: MaintenanceAction;

  @ApiProperty({ description: 'The progress of the current task' })
  progress?: number;

  @ApiProperty({ description: 'The current task' })
  task?: string;

  @ApiProperty({ description: 'The error message' })
  error?: string;
}

export class MaintenanceDetectInstallStorageFolderDto {
  @ValidateEnum({ enum: StorageFolder, name: 'StorageFolder' })
  folder!: StorageFolder;

  @ApiProperty({ description: 'Whether the folder is readable' })
  readable!: boolean;

  @ApiProperty({ description: 'Whether the folder is writable' })
  writable!: boolean;

  @ApiProperty({ description: 'The number of files in the folder' })
  files!: number;
}

export class MaintenanceDetectInstallResponseDto {
  @ApiProperty({ description: 'The storage folders to check' })
  storage!: MaintenanceDetectInstallStorageFolderDto[];
}
