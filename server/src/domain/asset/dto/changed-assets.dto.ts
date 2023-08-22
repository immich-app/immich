import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsUUID } from 'class-validator';

export class ChangedAssetsDto {
  @IsDate()
  @Type(() => Date)
  lastTime!: Date;

  @IsOptional()
  @IsUUID('4')
  @ApiProperty({ format: 'uuid' })
  userId?: string;
}
