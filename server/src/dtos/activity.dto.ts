import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { Activity } from 'src/database';
import { mapUser, UserResponseDto } from 'src/dtos/user.dto';
import { ValidateBoolean, ValidateEnum, ValidateUUID } from 'src/validation';

export enum ReactionType {
  COMMENT = 'comment',
  LIKE = 'like',
  ALBUM_UPDATE = 'album_update',
}

export enum ReactionLevel {
  ALBUM = 'album',
  ASSET = 'asset',
}

export type MaybeDuplicate<T> = { duplicate: boolean; value: T };

export class ActivityResponseDto {
  id!: string;
  createdAt!: Date;
  @ValidateEnum({ enum: ReactionType, name: 'ReactionType' })
  type!: ReactionType;
  user!: UserResponseDto;
  assetId!: string | null;
  comment?: string | null;
  @ApiPropertyOptional({ type: () => ActivityAlbumUpdateResponseDto, nullable: true })
  albumUpdate?: ActivityAlbumUpdateResponseDto | null;
}

export class ActivityStatisticsResponseDto {
  @ApiProperty({ type: 'integer' })
  comments!: number;

  @ApiProperty({ type: 'integer' })
  likes!: number;
}

export class ActivityDto {
  @ValidateUUID()
  albumId!: string;

  @ValidateUUID({ optional: true })
  assetId?: string;
}

export class ActivitySearchDto extends ActivityDto {
  @ValidateEnum({ enum: ReactionType, name: 'ReactionType', optional: true })
  type?: ReactionType;

  @ValidateEnum({ enum: ReactionLevel, name: 'ReactionLevel', optional: true })
  level?: ReactionLevel;

  @ValidateUUID({ optional: true })
  userId?: string;

  @ValidateBoolean({ optional: true })
  includeAlbumUpdate?: boolean;
}

const isComment = (dto: ActivityCreateDto) => dto.type === ReactionType.COMMENT;

export class ActivityCreateDto extends ActivityDto {
  @ValidateEnum({ enum: ReactionType, name: 'ReactionType' })
  type!: ReactionType;

  @ValidateIf(isComment)
  @IsNotEmpty()
  @IsString()
  comment?: string;
}

export const mapActivity = (activity: Activity): ActivityResponseDto => {
  const isAlbumUpdate = !!activity.aggregationId;
  const assetIds = activity.assetIds ?? [];
  const totalAssets = isAlbumUpdate ? (activity.albumUpdateAssetCount ?? assetIds.length) : assetIds.length;

  return {
    id: isAlbumUpdate ? activity.aggregationId! : activity.id,
    assetId: isAlbumUpdate ? null : activity.assetId,
    createdAt: activity.createdAt,
    comment: isAlbumUpdate ? null : activity.comment,
    type: isAlbumUpdate ? ReactionType.ALBUM_UPDATE : activity.isLiked ? ReactionType.LIKE : ReactionType.COMMENT,
    user: mapUser(activity.user),
    albumUpdate: isAlbumUpdate
      ? {
          aggregationId: activity.aggregationId!,
          assetIds,
          totalAssets,
        }
      : undefined,
  };
};

export class ActivityAlbumUpdateResponseDto {
  @ApiProperty()
  aggregationId!: string;

  @ApiProperty({ type: [String] })
  assetIds!: string[];

  @ApiProperty({ type: 'integer' })
  totalAssets!: number;
}
