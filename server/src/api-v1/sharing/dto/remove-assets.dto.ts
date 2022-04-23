import { IsNotEmpty } from 'class-validator';

export class RemoveAssetsDto {
  @IsNotEmpty()
  albumId: string;

  @IsNotEmpty()
  assetIds: string[];
}
