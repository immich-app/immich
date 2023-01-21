import { IsNotEmpty } from 'class-validator';

export class RestoreAssetsDto {
  @IsNotEmpty()
  assetIds!: string[];
}
