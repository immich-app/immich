import { ArrayMinSize } from 'class-validator';
import { AssetResponseDto, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { StackEntity } from 'src/entities/stack.entity';
import { ValidateUUID } from 'src/validation';

export class StackCreateDto {
  /** first asset becomes the primary */
  @ValidateUUID({ each: true })
  @ArrayMinSize(2)
  assetIds!: string[];
}

export class StackSearchDto {
  @ValidateUUID({ optional: true })
  primaryAssetId?: string;
}

export class StackUpdateDto {
  @ValidateUUID({ optional: true })
  primaryAssetId?: string;
}

export class StackResponseDto {
  id!: string;
  primaryAssetId!: string;
  assets!: AssetResponseDto[];
}

export const mapStack = (stack: StackEntity, { auth }: { auth?: AuthDto }) => {
  const primary = stack.assets.filter((asset) => asset.id === stack.primaryAssetId);
  const others = stack.assets.filter((asset) => asset.id !== stack.primaryAssetId);

  return {
    id: stack.id,
    primaryAssetId: stack.primaryAssetId,
    assets: [...primary, ...others].map((asset) => mapAsset(asset, { auth })),
  };
};
