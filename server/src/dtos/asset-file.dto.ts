import { ApiProperty } from '@nestjs/swagger';
import { Selectable } from 'kysely';
import { AssetFileType } from 'src/enum';
import { AssetFileTable } from 'src/schema/tables/asset-file.table';
import { ValidateBoolean, ValidateEnum, ValidateUUID } from 'src/validation';

export class AssetFileSearchDto {
  @ValidateUUID({ description: 'Asset ID to filter files by' })
  assetId!: string;

  @ValidateEnum({ enum: AssetFileType, name: 'AssetFileType', optional: true, description: 'Filter by type of file' })
  type?: AssetFileType;

  @ValidateBoolean({ optional: true, description: 'The file was generated from an edit' })
  isEdited?: boolean;

  @ValidateBoolean({ optional: true, description: 'The file is a progressively encoded JPEG' })
  isProgressive?: boolean;
}

export class AssetFileResponseDto {
  @ApiProperty({ description: 'Asset file ID' })
  id!: string;
  @ApiProperty({ description: 'Creation date', format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: 'Update date', format: 'date-time' })
  updatedAt!: Date;

  @ValidateEnum({ enum: AssetFileType, name: 'AssetFileType', description: 'Type of file' })
  type!: AssetFileType;

  @ApiProperty({ description: 'File path' })
  path!: string;

  @ApiProperty({ description: 'The file was generated from an edit' })
  isEdited!: boolean;

  @ApiProperty({ description: 'The file is a progressively encoded JPEG' })
  isProgressive!: boolean;
}

export const mapAssetFile = (file: Selectable<AssetFileTable>): AssetFileResponseDto => {
  return {
    id: file.id,
    // assetId: file.assetId,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
    type: file.type,
    path: file.path,
    isEdited: file.isEdited,
    isProgressive: file.isProgressive,
  };
};
