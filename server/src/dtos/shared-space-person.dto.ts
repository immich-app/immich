import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Optional, ValidateBoolean, ValidateUUID } from 'src/validation';

export class SharedSpacePersonUpdateDto {
  @ApiPropertyOptional({ description: 'Person name' })
  @Optional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ValidateBoolean({ optional: true, description: 'Person visibility (hidden)' })
  isHidden?: boolean;

  @ApiPropertyOptional({ format: 'date', description: 'Person date of birth' })
  @Optional({ nullable: true, emptyToNull: true })
  @IsString()
  birthDate?: string | null;

  @ValidateUUID({ optional: true, nullable: true, description: 'Representative face ID' })
  representativeFaceId?: string | null;
}

export class SharedSpacePersonAliasDto {
  @ApiProperty({ description: 'Alias name for this person' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  alias!: string;
}

export class SharedSpacePersonMergeDto {
  @ValidateUUID({ each: true, description: 'Person IDs to merge into target' })
  ids!: string[];
}

export class SharedSpacePersonResponseDto {
  @ApiProperty({ description: 'Person ID' })
  id!: string;

  @ApiProperty({ description: 'Space ID' })
  spaceId!: string;

  @ApiProperty({ description: 'Person name' })
  name!: string;

  @ApiProperty({ description: 'Thumbnail path' })
  thumbnailPath!: string;

  @ApiProperty({ description: 'Is hidden' })
  isHidden!: boolean;

  @ApiPropertyOptional({ format: 'date', description: 'Person date of birth' })
  birthDate?: string | null;

  @ApiPropertyOptional({ description: 'Representative face ID' })
  representativeFaceId?: string | null;

  @ApiProperty({ description: 'Number of faces assigned to this person' })
  faceCount!: number;

  @ApiProperty({ description: 'Number of unique assets with this person' })
  assetCount!: number;

  @ApiPropertyOptional({ description: 'User-specific alias for this person' })
  alias?: string | null;

  @ApiProperty({ description: 'Creation date' })
  createdAt!: string;

  @ApiProperty({ description: 'Last update date' })
  updatedAt!: string;

  @ApiPropertyOptional({ description: 'Person type (person or pet)' })
  type?: string;
}
