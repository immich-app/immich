import { IsNotEmpty } from 'class-validator';

export class CheckDuplicateAssetDto {
  @IsNotEmpty()
  deviceAssetId!: string;

  @IsNotEmpty()
  deviceId!: string;
}
