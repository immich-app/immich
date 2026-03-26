import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, Max, Min } from 'class-validator';
import { Optional, ValidateBoolean, ValidateDate, ValidateUUID } from 'src/validation';

export enum MapMediaType {
  Image = 'IMAGE',
  Video = 'VIDEO',
}

export class FilteredMapMarkerDto {
  @ValidateUUID({ each: true, optional: true, description: 'Filter by person IDs' })
  personIds?: string[];

  @ValidateUUID({ each: true, optional: true, description: 'Filter by tag IDs' })
  tagIds?: string[];

  @ValidateUUID({ optional: true, description: 'Scope to a shared space' })
  spaceId?: string;

  @ApiProperty({ type: String, required: false, description: 'Camera make' })
  @Optional()
  make?: string;

  @ApiProperty({ type: String, required: false, description: 'Camera model' })
  @Optional()
  model?: string;

  @ApiProperty({ type: Number, required: false, description: 'Minimum star rating', minimum: 1, maximum: 5 })
  @Optional()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({ enum: MapMediaType, required: false, description: 'Filter by media type' })
  @Optional()
  @IsEnum(MapMediaType)
  type?: MapMediaType;

  @ValidateDate({ optional: true, description: 'Filter assets taken after this date' })
  takenAfter?: Date;

  @ValidateDate({ optional: true, description: 'Filter assets taken before this date' })
  takenBefore?: Date;

  @ValidateBoolean({ optional: true, description: 'Filter by favorite status' })
  isFavorite?: boolean;
}
