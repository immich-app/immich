import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsDateString, IsEnum, IsInt, IsPositive, ValidateNested } from 'class-validator';
import { ActivityResponseDto } from 'src/dtos/activity.dto';
import { AlbumAssetResponseDto } from 'src/dtos/album-asset.dto';
import { AlbumResponseDto } from 'src/dtos/album.dto';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { MemoryResponseDto } from 'src/dtos/memory.dto';
import { PartnerResponseDto } from 'src/dtos/partner.dto';
import { PersonResponseDto } from 'src/dtos/person.dto';
import { SharedLinkResponseDto } from 'src/dtos/shared-link.dto';
import { StackResponseDto } from 'src/dtos/stack.dto';
import { UserResponseDto } from 'src/dtos/user.dto';
import { SyncState } from 'src/entities/session-sync-state.entity';
import { SyncAction, SyncEntity } from 'src/enum';
import { Optional, ValidateDate, ValidateUUID } from 'src/validation';

class SyncCheckpointDto {
  @ValidateUUID()
  id!: string;

  @IsDateString()
  timestamp!: string;
}

export class SyncAcknowledgeDto implements SyncState {
  @Optional()
  @ValidateNested()
  @Type(() => SyncCheckpointDto)
  activity?: SyncCheckpointDto;

  @Optional()
  @ValidateNested()
  @Type(() => SyncCheckpointDto)
  album?: SyncCheckpointDto;

  @Optional()
  @ValidateNested()
  @Type(() => SyncCheckpointDto)
  albumUser?: SyncCheckpointDto;

  @Optional()
  @ValidateNested()
  @Type(() => SyncCheckpointDto)
  albumAsset?: SyncCheckpointDto;

  @Optional()
  @ValidateNested()
  @Type(() => SyncCheckpointDto)
  asset?: SyncCheckpointDto;

  @Optional()
  @ValidateNested()
  @Type(() => SyncCheckpointDto)
  assetAlbum?: SyncCheckpointDto;

  @Optional()
  @ValidateNested()
  @Type(() => SyncCheckpointDto)
  assetPartner?: SyncCheckpointDto;

  @Optional()
  @ValidateNested()
  @Type(() => SyncCheckpointDto)
  memory?: SyncCheckpointDto;

  @Optional()
  @ValidateNested()
  @Type(() => SyncCheckpointDto)
  partner?: SyncCheckpointDto;

  @Optional()
  @ValidateNested()
  @Type(() => SyncCheckpointDto)
  person?: SyncCheckpointDto;

  @Optional()
  @ValidateNested()
  @Type(() => SyncCheckpointDto)
  sharedLink?: SyncCheckpointDto;

  @Optional()
  @ValidateNested()
  @Type(() => SyncCheckpointDto)
  stack?: SyncCheckpointDto;

  @Optional()
  @ValidateNested()
  @Type(() => SyncCheckpointDto)
  tag?: SyncCheckpointDto;

  @Optional()
  @ValidateNested()
  @Type(() => SyncCheckpointDto)
  user?: SyncCheckpointDto;
}

export class SyncStreamResponseDto {
  @ApiProperty({ enum: SyncEntity, enumName: 'SyncType' })
  type!: SyncEntity;

  @ApiProperty({ enum: SyncAction, enumName: 'SyncAction' })
  action!: SyncAction;

  @ApiProperty({
    anyOf: [
      { $ref: getSchemaPath(AssetResponseDto) },
      { $ref: getSchemaPath(AlbumResponseDto) },
      { $ref: getSchemaPath(AlbumAssetResponseDto) },
      { $ref: getSchemaPath(ActivityResponseDto) },
      { $ref: getSchemaPath(MemoryResponseDto) },
      { $ref: getSchemaPath(PartnerResponseDto) },
      { $ref: getSchemaPath(PersonResponseDto) },
      { $ref: getSchemaPath(SharedLinkResponseDto) },
      { $ref: getSchemaPath(StackResponseDto) },
      { $ref: getSchemaPath(UserResponseDto) },
    ],
  })
  data!:
    | ActivityResponseDto
    | AssetResponseDto
    | AlbumResponseDto
    | AlbumAssetResponseDto
    | MemoryResponseDto
    | PartnerResponseDto
    | PersonResponseDto
    | SharedLinkResponseDto
    | StackResponseDto
    | UserResponseDto;
}

export class SyncStreamDto {
  @IsEnum(SyncEntity, { each: true })
  @ApiProperty({ enum: SyncEntity, isArray: true })
  @ArrayNotEmpty()
  types!: SyncEntity[];
}

export class AssetFullSyncDto {
  @ValidateUUID({ optional: true })
  lastId?: string;

  @ValidateDate()
  updatedUntil!: Date;

  @IsInt()
  @IsPositive()
  @ApiProperty({ type: 'integer' })
  limit!: number;

  @ValidateUUID({ optional: true })
  userId?: string;
}

export class AssetDeltaSyncDto {
  @ValidateDate()
  updatedAfter!: Date;

  @ValidateUUID({ each: true })
  userIds!: string[];
}

export class AssetDeltaSyncResponseDto {
  needsFullSync!: boolean;
  upserted!: AssetResponseDto[];
  deleted!: string[];
}
