import { AssetResponseDto } from '.';

export class ChangedAssetsResponseDto {
  upserted!: AssetResponseDto[];
  deleted!: string[];
  needsFullSync!: boolean;
}
