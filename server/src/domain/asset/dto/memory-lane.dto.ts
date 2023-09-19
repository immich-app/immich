import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class MemoryLaneDto {
  @IsDate()
  @Type(() => Date)
  timestamp!: Date;
}
