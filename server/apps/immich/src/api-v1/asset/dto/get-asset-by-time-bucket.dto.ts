import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class GetAssetByTimeBucketDto {
  @IsNotEmpty()
  @ApiProperty({
    isArray: true,
    type: String,
    title: 'Array of date time buckets',
    example: ['2015-06-01T00:00:00.000Z', '2016-02-01T00:00:00.000Z', '2016-03-01T00:00:00.000Z'],
  })
  timeBucket!: string[];

  @IsOptional()
  @IsUUID('4')
  @ApiProperty({ format: 'uuid' })
  userId?: string;
}
