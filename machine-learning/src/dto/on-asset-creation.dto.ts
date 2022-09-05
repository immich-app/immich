import { IsNotEmpty, IsString } from 'class-validator';

export class OnAssetCreationDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  resizePath!: string;
}
