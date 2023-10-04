import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class MemoryLaneDto {
  @IsInt()
  @Type(() => Number)
  @Max(31)
  @Min(1)
  day!: number;

  @IsInt()
  @Type(() => Number)
  @Max(12)
  @Min(1)
  month!: number;
}
