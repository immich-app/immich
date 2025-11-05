import { ValidateBoolean } from 'src/validation';

export class MaintenanceModeResponseDto {
  @ValidateBoolean()
  isMaintenanceMode!: boolean;
}

export class MaintenanceAuthDto {
  username!: string;
}
