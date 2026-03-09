import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize } from 'class-validator';
import { Stack } from 'src/database';
import { AssetResponseDto, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { ValidateUUID } from 'src/validation';

export class StackCreateDto {
  @ValidateUUID({ each: true, description: 'Asset IDs (first becomes primary, min 2)' })
  @ArrayMinSize(2)
  assetIds!: string[];
}

export class StackSearchDto {
  @ValidateUUID({ optional: true, description: 'Filter by primary asset ID' })
  primaryAssetId?: string;
}

export class StackUpdateDto {
  @ValidateUUID({ optional: true, description: 'Primary asset ID' })
  primaryAssetId?: string;
}

export class StackResponseDto {
  @ApiProperty({ description: 'Stack ID' })
  id!: string;
  @ApiProperty({ description: 'Primary asset ID' })
  primaryAssetId!: string;
  @ApiProperty({ description: 'Stack assets' })
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
