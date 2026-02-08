import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude } from 'class-validator';
import { ValidateBoolean, ValidateDate } from 'src/validation';

export class MapReverseGeocodeDto {
  @ApiProperty({ format: 'double', description: 'Latitude (-90 to 90)' })
  @Type(() => Number)
  @IsLatitude({ message: ({ property }) => `${property} must be a number between -90 and 90` })
  lat!: number;

  @ApiProperty({ format: 'double', description: 'Longitude (-180 to 180)' })
  @Type(() => Number)
  @IsLongitude({ message: ({ property }) => `${property} must be a number between -180 and 180` })
  lon!: number;
}

export class MapReverseGeocodeResponseDto {
  @ApiProperty({ description: 'City name' })
  city!: string | null;

  @ApiProperty({ description: 'State/Province name' })
  state!: string | null;

  @ApiProperty({ description: 'Country name' })
  country!: string | null;
}

export class MapMarkerDto {
  @ValidateBoolean({ optional: true, description: 'Filter by archived status' })
  isArchived?: boolean;

  @ValidateBoolean({ optional: true, description: 'Filter by favorite status' })
  isFavorite?: boolean;

  @ValidateDate({ optional: true, description: 'Filter assets created after this date' })
  fileCreatedAfter?: Date;

  @ValidateDate({ optional: true, description: 'Filter assets created before this date' })
  fileCreatedBefore?: Date;

  @ValidateBoolean({ optional: true, description: 'Include partner assets' })
  withPartners?: boolean;

  @ValidateBoolean({ optional: true, description: 'Include shared album assets' })
  withSharedAlbums?: boolean;
}

export class MapMarkerResponseDto {
  @ApiProperty({ description: 'Asset ID' })
  id!: string;

  @ApiProperty({ format: 'double', description: 'Latitude' })
  lat!: number;

  @ApiProperty({ format: 'double', description: 'Longitude' })
  lon!: number;

  @ApiProperty({ description: 'City name' })
  city!: string | null;

  @ApiProperty({ description: 'State/Province name' })
  state!: string | null;

  @ApiProperty({ description: 'Country name' })
  country!: string | null;
}
