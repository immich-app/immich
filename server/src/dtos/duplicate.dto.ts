import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { ValidateUUID } from 'src/validation';

export class DuplicateResponseDto {
  @ApiProperty({ description: 'Duplicate group ID' })
  duplicateId!: string;
  @ApiProperty({ description: 'Duplicate assets' })
  assets!: AssetResponseDto[];

  @ValidateUUID({ each: true, description: 'Suggested asset IDs to keep based on file size and EXIF data' })
  suggestedKeepAssetIds!: string[];
}

export class DuplicateResolveGroupDto {
  @ValidateUUID()
  duplicateId!: string;

  @ValidateUUID({ each: true, description: 'Asset IDs to keep' })
  keepAssetIds!: string[];

  @ValidateUUID({ each: true, description: 'Asset IDs to trash or delete' })
  trashAssetIds!: string[];
}

export class DuplicateResolveDto {
  @ApiProperty({ description: 'List of duplicate groups to resolve' })
  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => DuplicateResolveGroupDto)
  @ArrayMinSize(1)
  groups!: DuplicateResolveGroupDto[];
}
