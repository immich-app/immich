import { MaintenanceAction } from 'src/enum';
import { ValidateEnum, ValidateString } from 'src/validation';

export class SetMaintenanceModeDto {
  @ValidateEnum({ enum: MaintenanceAction, name: 'MaintenanceAction' })
  action!: MaintenanceAction;

  @ValidateString({ optional: true })
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
  action?: MaintenanceAction;

  progress?: number;
  task?: string;
  error?: string;
}
