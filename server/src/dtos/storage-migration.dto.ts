import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsUUID, Max, Min, ValidateNested } from 'class-validator';
import { ValidateBoolean } from 'src/validation';

export class StorageMigrationFileTypesDto {
  @ValidateBoolean({ optional: true, description: 'Include original files' })
  originals: boolean = true;

  @ValidateBoolean({ optional: true, description: 'Include thumbnail files' })
  thumbnails: boolean = true;

  @ValidateBoolean({ optional: true, description: 'Include preview files' })
  previews: boolean = true;

  @ValidateBoolean({ optional: true, description: 'Include full-size files' })
  fullsize: boolean = true;

  @ValidateBoolean({ optional: true, description: 'Include encoded video files' })
  encodedVideos: boolean = true;

  @ValidateBoolean({ optional: true, description: 'Include sidecar files' })
  sidecars: boolean = true;

  @ValidateBoolean({ optional: true, description: 'Include person thumbnail files' })
  personThumbnails: boolean = true;

  @ValidateBoolean({ optional: true, description: 'Include profile image files' })
  profileImages: boolean = true;
}

export class StorageMigrationStartDto {
  @IsEnum(['toS3', 'toDisk'])
  @IsNotEmpty()
  @ApiProperty({ enum: ['toS3', 'toDisk'], description: 'Migration direction' })
  direction!: 'toS3' | 'toDisk';

  @ValidateBoolean({ optional: true, description: 'Delete source files after migration' })
  deleteSource: boolean = false;

  @ValidateNested()
  @Type(() => StorageMigrationFileTypesDto)
  @ApiProperty({ type: StorageMigrationFileTypesDto, description: 'File types to migrate' })
  fileTypes!: StorageMigrationFileTypesDto;

  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  @ApiProperty({
    type: 'integer',
    minimum: 1,
    maximum: 20,
    default: 5,
    description: 'Concurrency level',
    required: false,
  })
  concurrency: number = 5;
}

export class StorageMigrationEstimateQueryDto {
  @IsEnum(['toS3', 'toDisk'])
  @IsNotEmpty()
  @ApiProperty({ enum: ['toS3', 'toDisk'], description: 'Migration direction' })
  direction!: 'toS3' | 'toDisk';
}

export class StorageMigrationBatchParamDto {
  @IsUUID('4')
  @IsNotEmpty()
  @ApiProperty({ format: 'uuid', description: 'Batch ID' })
  batchId!: string;
}
