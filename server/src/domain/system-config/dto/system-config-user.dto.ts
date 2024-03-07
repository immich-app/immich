import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class SystemConfigUserDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  deleteDelay!: number;
}
