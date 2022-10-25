import { IsNotEmpty } from 'class-validator';

export class AddAssetsDto {
  @IsNotEmpty()
  assetIds!: string[];
}
