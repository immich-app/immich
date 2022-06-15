import { IsNotEmpty } from 'class-validator';

export class AddAssetsDto {
  @IsNotEmpty()
  albumId: string;

  @IsNotEmpty()
  assetIds: string[];
}
