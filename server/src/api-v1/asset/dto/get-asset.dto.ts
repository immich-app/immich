import { IsNotEmpty } from 'class-validator';

class GetAssetDto {
  @IsNotEmpty()
  deviceId: string;
}
