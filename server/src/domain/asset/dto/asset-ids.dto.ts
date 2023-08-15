import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ValidateUUID } from '../../domain.util';

export class AssetIdsDto {
  @ValidateUUID({ each: true })
  assetIds!: string[];
}

export enum AssetJobName {
  REGENERATE_THUMBNAIL = 'regenerate-thumbnail',
  REFRESH_METADATA = 'refresh-metadata',
  TRANSCODE_VIDEO = 'transcode-video',
}

export class AssetJobsDto extends AssetIdsDto {
  @ApiProperty({ enumName: 'AssetJobName', enum: AssetJobName })
  @IsEnum(AssetJobName)
  name!: AssetJobName;
}
