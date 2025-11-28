import { ApiProperty } from '@nestjs/swagger';
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

export class MaintenanceIntegrityReportSummaryResponseDto {
  @ApiProperty({ type: 'integer' })
  [IntegrityReportType.ChecksumFail]!: number;
  @ApiProperty({ type: 'integer' })
  [IntegrityReportType.MissingFile]!: number;
  @ApiProperty({ type: 'integer' })
  [IntegrityReportType.OrphanFile]!: number;
}

export class MaintenanceGetIntegrityReportDto {
  @ValidateEnum({ enum: IntegrityReportType, name: 'IntegrityReportType' })
  type!: IntegrityReportType;

  // todo: paginate
  // @IsInt()
  // @Min(1)
  // @Type(() => Number)
  // @Optional()
  // page?: number;
}

class MaintenanceIntegrityReportDto {
  id!: string;
  @ValidateEnum({ enum: IntegrityReportType, name: 'IntegrityReportType' })
  type!: IntegrityReportType;
  path!: string;
}

export class MaintenanceIntegrityReportResponseDto {
  items!: MaintenanceIntegrityReportDto[];
}
