import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export enum TimeGroupEnum {
  Day = 'day',
  Month = 'month',
}

export class GetAssetCountByTimeBucketDto {
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    enum: TimeGroupEnum,
    enumName: 'TimeGroupEnum',
  })
  timeGroup!: TimeGroupEnum;

  @IsOptional()
  @IsUUID('4')
  @ApiProperty({ format: 'uuid' })
  userId?: string;
}
