import { ApiProperty } from '@nestjs/swagger';

export class AssetCountByTimeBucketResponseDto {
  @ApiProperty({ type: 'string' })
  timeGroup!: string;

  @ApiProperty({ type: 'integer' })
  count!: number;
}

export class AssetCountByTimeGroupResponseDto {
  buckets!: AssetCountByTimeBucketResponseDto[];

  @ApiProperty({ type: 'integer' })
  count!: number;
}

export function mapAssetCountByTimeBucket(
  result: AssetCountByTimeBucketResponseDto[],
): AssetCountByTimeGroupResponseDto {
  return {
    buckets: result,
    count: result.map((group) => group.count).reduce((a, b) => a + b, 0),
  };
}
