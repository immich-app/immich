import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class AuditQueryDto {
  @IsDate()
  @Type(() => Date)
  lastTime!: Date;
}
