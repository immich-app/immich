import { IsBoolean } from 'class-validator';

export class UpdateAssetDto {
  @IsBoolean()
  isFavorite!: boolean;
}
