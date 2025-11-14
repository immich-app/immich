import { ValidateBoolean, ValidateString } from 'src/validation';

export class SetMaintenanceModeDto {
  @ValidateBoolean()
  maintenanceMode!: boolean;
}

export class MaintenanceLoginDto {
  @ValidateString({ optional: true })
  token?: string;
}

export class MaintenanceAuthDto {
  username!: string;
}
