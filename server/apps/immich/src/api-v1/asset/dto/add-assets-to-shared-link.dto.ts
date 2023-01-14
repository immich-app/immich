import { IsNotEmpty } from 'class-validator';

export class UpdateAssetsToSharedLinkDto {
  @IsNotEmpty()
  assetIds!: string[];
}
