import { ApiProperty } from '@nestjs/swagger';

export class AutoStackCandidateAssetDto {
  @ApiProperty({ format: 'uuid' })
  assetId!: string;
  @ApiProperty({ description: 'Position within the candidate (0-based ordering heuristic)' })
  position!: number;
}

export class AutoStackCandidateResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
  @ApiProperty({ description: 'Number of assets in the candidate' })
  count!: number;
  @ApiProperty({ description: 'Heuristic score 0-100 (higher is more likely a true stack)', minimum: 0, maximum: 100 })
  score!: number;
  @ApiProperty({ type: [AutoStackCandidateAssetDto] })
  assets!: AutoStackCandidateAssetDto[];
  @ApiProperty({
    description: 'Breakdown of score components',
    required: false,
    example: { size: 40, timeSpan: 10, continuity: 5, visual: 12, exposure: 8 },
  })
  scoreComponents?: Record<string, number>;
  @ApiProperty({
    description: 'Average raw CLIP cosine similarity across asset pairs (-1..1), if embeddings were available',
    required: false,
    example: 0.74,
  })
  avgCos?: number;
}
