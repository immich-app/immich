import { AssetResponseDto } from '@app/domain';

export class ChangedAssetsResponseDto {
  upserted!: AssetResponseDto[];
  deleted!: string[];
  needsFullSync!: boolean;
}
