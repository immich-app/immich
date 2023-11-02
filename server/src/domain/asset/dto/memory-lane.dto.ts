import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { Optional } from '../../domain.util';

export class MemoryLaneDto {
  @IsInt()
  @Type(() => Number)
  @Max(31)
  @Min(1)
  @ApiProperty({ type: 'integer' })
  day!: number;

  @IsInt()
  @Type(() => Number)
  @Max(12)
  @Min(1)
  @ApiProperty({ type: 'integer' })
  month!: number;

  @IsInt()
  @Type(() => Number)
  @Min(0)
  @ApiProperty({ type: 'integer' })
  @Optional()
  days?: number;
}
