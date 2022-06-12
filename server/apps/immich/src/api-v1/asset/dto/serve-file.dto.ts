import { Transform } from 'class-transformer';
import { IsBoolean, IsBooleanString, IsNotEmpty, IsOptional } from 'class-validator';

export class ServeFileDto {
  //assetId
  @IsNotEmpty()
  aid: string;

  //deviceId
  @IsNotEmpty()
  did: string;

  @IsOptional()
  @IsBooleanString()
  isThumb: string;

  @IsOptional()
  @IsBooleanString()
  isWeb: string;
}
