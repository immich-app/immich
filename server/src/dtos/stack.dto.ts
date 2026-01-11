import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { ArrayMinSize } from 'class-validator';
import { Stack } from 'src/database';
import { AssetResponseDto, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { ValidateUUID } from 'src/validation';

@ApiSchema({ description: 'Stack creation request with asset IDs' })
export class StackCreateDto {
  @ApiProperty({ description: 'Asset IDs (first becomes primary, min 2)', type: [String] })
  @ValidateUUID({ each: true })
  @ArrayMinSize(2)
  assetIds!: string[];
}

@ApiSchema({ description: 'Stack search query with optional primary asset ID filter' })
export class StackSearchDto {
  @ApiPropertyOptional({ description: 'Filter by primary asset ID' })
  @ValidateUUID({ optional: true })
  primaryAssetId?: string;
}

@ApiSchema({ description: 'Stack update request with optional primary asset ID' })
export class StackUpdateDto {
  @ApiPropertyOptional({ description: 'Primary asset ID' })
  @ValidateUUID({ optional: true })
  primaryAssetId?: string;
}

@ApiSchema({ description: 'Stack response with assets' })
export class StackResponseDto {
  @ApiProperty({ description: 'Stack ID' })
  id!: string;
  @ApiProperty({ description: 'Primary asset ID' })
  primaryAssetId!: string;
  @ApiProperty({ description: 'Stack assets', type: () => [AssetResponseDto] })
  assets!: AssetResponseDto[];
}

export const mapStack = (stack: Stack, { auth }: { auth?: AuthDto }) => {
  const primary = stack.assets.filter((asset) => asset.id === stack.primaryAssetId);
  const others = stack.assets.filter((asset) => asset.id !== stack.primaryAssetId);

  return {
    id: stack.id,
    primaryAssetId: stack.primaryAssetId,
    assets: [...primary, ...others].map((asset) => mapAsset(asset, { auth })),
  };
};
