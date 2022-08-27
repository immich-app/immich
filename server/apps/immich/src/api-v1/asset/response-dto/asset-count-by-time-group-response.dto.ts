import { ApiProperty } from '@nestjs/swagger';

export class AssetCountByTimeGroupDto {
  @ApiProperty({ type: 'string' })
  timeGroup!: string;

  @ApiProperty({ type: 'integer' })
  count!: number;
}

export class AssetCountByTimeGroupResponseDto {
  groups!: AssetCountByTimeGroupDto[];

  @ApiProperty({ type: 'integer' })
  totalAssets!: number;
}

export function mapAssetCountByTimeGroupResponse(result: AssetCountByTimeGroupDto[]): AssetCountByTimeGroupResponseDto {
  return {
    groups: result,
    totalAssets: result.map((group) => group.count).reduce((a, b) => a + b, 0),
  };
}
