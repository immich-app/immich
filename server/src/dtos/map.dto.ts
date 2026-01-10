import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ description: 'City name', nullable: true })
  city!: string | null;

  @ApiProperty({ description: 'State/Province name', nullable: true })
  state!: string | null;

  @ApiProperty({ description: 'Country name', nullable: true })
  country!: string | null;
}

export class MapMarkerDto {
  @ApiPropertyOptional({ description: 'Filter by archived status' })
  @ValidateBoolean({ optional: true })
  isArchived?: boolean;

  @ApiPropertyOptional({ description: 'Filter by favorite status' })
  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @ApiPropertyOptional({ description: 'Filter assets created after this date' })
  @ValidateDate({ optional: true })
  fileCreatedAfter?: Date;

  @ApiPropertyOptional({ description: 'Filter assets created before this date' })
  @ValidateDate({ optional: true })
  fileCreatedBefore?: Date;

  @ApiPropertyOptional({ description: 'Include partner assets' })
  @ValidateBoolean({ optional: true })
  withPartners?: boolean;

  @ApiPropertyOptional({ description: 'Include shared album assets' })
  @ValidateBoolean({ optional: true })
  withSharedAlbums?: boolean;
}

export class MapMarkerResponseDto {
  @ApiProperty({ description: 'Asset ID' })
  id!: string;

  @ApiProperty({ format: 'double', description: 'Latitude' })
  lat!: number;

  @ApiProperty({ format: 'double', description: 'Longitude' })
  lon!: number;

  @ApiProperty({ description: 'City name', nullable: true })
  city!: string | null;

  @ApiProperty({ description: 'State/Province name', nullable: true })
  state!: string | null;

  @ApiProperty({ description: 'Country name', nullable: true })
  country!: string | null;
}
