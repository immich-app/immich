import { IsNotEmpty } from 'class-validator';

export class CheckExistingAssetsDto {
  @IsNotEmpty()
  deviceAssetIds!: string[];

  @IsNotEmpty()
  deviceId!: string;
}