import { ApiProperty } from '@nestjs/swagger';

export class AssetCountByGroupDto {
  @ApiProperty({ type: 'string' })
  timeGroup!: string;

  @ApiProperty({ type: 'integer' })
  count!: number;
}

export class AssetCountByTimeGroupResponseDto {
  groups!: AssetCountByGroupDto[];

  @ApiProperty({ type: 'integer' })
  totalAssets!: number;
}
