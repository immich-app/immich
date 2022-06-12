import { IsNotEmpty } from 'class-validator';

export class RemoveAssetsDto {
  @IsNotEmpty()
  assetIds: string[];
}
