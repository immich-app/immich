import { ApiProperty } from '@nestjs/swagger';

export class AssetCountByTimeBucket {
  @ApiProperty({ type: 'string' })
  timeBucket!: string;

  @ApiProperty({ type: 'integer' })
  count!: number;
}

export class AssetCountByTimeBucketResponseDto {
  buckets!: AssetCountByTimeBucket[];

  @ApiProperty({ type: 'integer' })
  totalCount!: number;
}

export function mapAssetCountByTimeBucket(result: AssetCountByTimeBucket[]): AssetCountByTimeBucketResponseDto {
  return {
    buckets: result,
    totalCount: result.map((group) => group.count).reduce((a, b) => a + b, 0),
  };
}
