import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude } from 'class-validator';
import { ValidateBoolean, ValidateDate } from 'src/validation';

export class MapReverseGeocodeDto {
  @ApiProperty({ format: 'double' })
  @Type(() => Number)
  @IsLatitude()
  lat!: number;

  @ApiProperty({ format: 'double' })
  @Type(() => Number)
  @IsLongitude()
  lon!: number;
}

export class MapReverseGeocodeResponseDto {
  @ApiProperty()
  city!: string | null;

  @ApiProperty()
  state!: string | null;

  @ApiProperty()
  country!: string | null;
}

export class MapMarkerDto {
  @ValidateBoolean({ optional: true })
  isArchived?: boolean;

  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @ValidateDate({ optional: true })
  fileCreatedAfter?: Date;

  @ValidateDate({ optional: true })
  fileCreatedBefore?: Date;

  @ValidateBoolean({ optional: true })
  withPartners?: boolean;

  @ValidateBoolean({ optional: true })
  withSharedAlbums?: boolean;
}

export class MapMarkerResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ format: 'double' })
  lat!: number;

  @ApiProperty({ format: 'double' })
  lon!: number;

  @ApiProperty()
  city!: string | null;

  @ApiProperty()
  state!: string | null;

  @ApiProperty()
  country!: string | null;
}
