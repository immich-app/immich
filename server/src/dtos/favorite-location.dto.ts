import { IsLatitude, IsLongitude, IsString } from 'class-validator';
import { Optional } from 'src/validation';

export class CreateFavoriteLocationDto {
  @IsString()
  name!: string;

  @IsLatitude()
  latitude!: number;

  @IsLongitude()
  longitude!: number;
}

export class UpdateFavoriteLocationDto {
  @Optional()
  @IsString()
  name?: string;

  @Optional()
  @IsLatitude()
  latitude?: number;

  @Optional()
  @IsLongitude()
  longitude?: number;
}

export class FavoriteLocationResponseDto {
  id!: string;
  name!: string;
  latitude!: number | null;
  longitude!: number | null;
}
