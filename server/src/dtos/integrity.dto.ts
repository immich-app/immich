import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { IntegrityReportType } from 'src/enum';
import { ValidateEnum } from 'src/validation';

export class IntegrityReportSummaryResponseDto {
  @ApiProperty({ type: 'integer' })
  [IntegrityReportType.ChecksumFail]!: number;
  @ApiProperty({ type: 'integer' })
  [IntegrityReportType.MissingFile]!: number;
  @ApiProperty({ type: 'integer' })
  [IntegrityReportType.UntrackedFile]!: number;
}

export class IntegrityGetReportDto {
  @ValidateEnum({ enum: IntegrityReportType, name: 'IntegrityReportType' })
  type!: IntegrityReportType;

  @ApiPropertyOptional({ description: 'Cursor for pagination', default: 1 })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 500 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number;
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
  nextCursor?: string;
}
