import { IsNotEmpty } from 'class-validator';

export class GetAssetDto {
  @IsNotEmpty()
  deviceId: string;
}
