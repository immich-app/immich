import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class UserUploadsStatsQueryDto {
  @ApiPropertyOptional({
    description: 'Inclusive start date (YYYY-MM-DD). Defaults to 52 weeks before `to`/now.',
    example: '2024-11-03',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'from must be YYYY-MM-DD' })
  from?: string;

  @ApiPropertyOptional({
    description: 'Exclusive end date (YYYY-MM-DD). Defaults to today.',
    example: '2025-11-03',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'to must be YYYY-MM-DD' })
  to?: string;

  @ApiPropertyOptional({
    description: 'IANA timezone for grouping days (default: UTC).',
    example: 'UTC',
  })
  @IsOptional()
  @IsString()
  tz?: string;
}

export class DayCountDto {
  @ApiProperty({ description: 'Date (YYYY-MM-DD)', example: '2025-01-15' })
  date!: string;

  @ApiProperty({ description: 'Number of uploads on that date', example: 3 })
  count!: number;
}

export class UploadsSummaryDto {
  @ApiProperty({ description: 'Total uploads across the series', example: 42 })
  totalCount!: number;
}

export class UserUploadsStatsResponseDto {
  @ApiProperty({ description: 'User id' })
  userId!: string;

  @ApiProperty({ description: 'First date in the filled series (YYYY-MM-DD)', example: '2024-11-03' })
  from!: string;

  @ApiProperty({ description: 'Last date in the filled series (YYYY-MM-DD)', example: '2025-11-02' })
  to!: string;

  @ApiProperty({ type: [DayCountDto], description: 'One item per calendar day in range' })
  series!: DayCountDto[];

  @ApiProperty({ type: UploadsSummaryDto })
  summary!: UploadsSummaryDto;
}
