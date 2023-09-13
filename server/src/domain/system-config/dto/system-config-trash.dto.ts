import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, Min } from 'class-validator';

export class SystemConfigTrashDto {
  @IsBoolean()
  enabled!: boolean;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  days!: number;
}
