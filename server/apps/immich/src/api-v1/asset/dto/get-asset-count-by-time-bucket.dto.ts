import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export enum TimeGroupEnum {
  Day = 'day',
  Month = 'month',
}
export class GetAssetCountByTimeBucketDto {
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    enum: TimeGroupEnum,
    enumName: 'TimeBucketEnum',
  })
  timeGroup!: TimeGroupEnum;
}
