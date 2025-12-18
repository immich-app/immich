import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { IntegrityReportType } from 'src/enum';
import { ValidateEnum } from 'src/validation';

export class IntegrityReportSummaryResponseDto {
  @ApiProperty({ type: 'integer' })
  [IntegrityReportType.ChecksumFail]!: number;
  @ApiProperty({ type: 'integer' })
  [IntegrityReportType.MissingFile]!: number;
  @ApiProperty({ type: 'integer' })
  [IntegrityReportType.OrphanFile]!: number;
}

export class IntegrityGetReportDto {
  @ValidateEnum({ enum: IntegrityReportType, name: 'IntegrityReportType' })
  type!: IntegrityReportType;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  size?: number;
}

export class IntegrityDeleteReportDto {
  @ValidateEnum({ enum: IntegrityReportType, name: 'IntegrityReportType' })
  type!: IntegrityReportType;
}

class IntegrityReportDto {
  id!: string;
  @ValidateEnum({ enum: IntegrityReportType, name: 'IntegrityReportType' })
  type!: IntegrityReportType;
  path!: string;
}

export class IntegrityReportResponseDto {
  items!: IntegrityReportDto[];
  hasNextPage!: boolean;
}
