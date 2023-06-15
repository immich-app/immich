import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsPositive } from 'class-validator';

export class MemoryLaneDto {
  /** Get pictures for +24 hours from this time going back x years */
  @IsDate()
  @Type(() => Date)
  timestamp!: Date;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  years = 30;
}
