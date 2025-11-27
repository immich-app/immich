import { IsEnum } from 'class-validator';
import { IntegrityReportType, MaintenanceAction } from 'src/enum';
import { ValidateEnum, ValidateString } from 'src/validation';

export class SetMaintenanceModeDto {
  @ValidateEnum({ enum: MaintenanceAction, name: 'MaintenanceAction' })
  action!: MaintenanceAction;
}

export class MaintenanceLoginDto {
  @ValidateString({ optional: true })
  token?: string;
}

export class MaintenanceAuthDto {
  username!: string;
}

export class MaintenanceGetIntegrityReportDto {
  // todo: paginate
  // @IsInt()
  // @Min(1)
  // @Type(() => Number)
  // @Optional()
  // page?: number;
}

class MaintenanceIntegrityReportDto {
  id!: string;
  @IsEnum(IntegrityReportType)
  type!: IntegrityReportType;
  path!: string;
}

export class MaintenanceIntegrityReportResponseDto {
  items!: MaintenanceIntegrityReportDto[];
}
