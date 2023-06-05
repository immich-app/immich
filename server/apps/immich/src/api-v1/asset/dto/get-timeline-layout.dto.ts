import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { toBoolean } from '../../../utils/transform.util';

export class GetTimelineLayoutDto {
  @IsOptional()
  @IsUUID('4')
  @ApiProperty({ format: 'uuid' })
  userId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  withoutThumbs?: boolean;
}
