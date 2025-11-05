import { ValidateBoolean, ValidateString } from 'src/validation';

export class MaintenanceModeResponseDto {
  @ValidateBoolean()
  isMaintenanceMode!: boolean;
}

export class MaintenanceLoginDto {
  @ValidateString()
  token!: string;
}

export class MaintenanceAuthDto {
  username!: string;
}
