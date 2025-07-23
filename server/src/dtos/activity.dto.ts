import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { Activity } from 'src/database';
import { mapUser, UserResponseDto } from 'src/dtos/user.dto';
import { ValidateEnum, ValidateUUID } from 'src/validation';

export enum ReactionType {
  COMMENT = 'comment',
  LIKE = 'like',
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
  return {
    id: activity.id,
    assetId: activity.assetId,
    createdAt: activity.createdAt,
    comment: activity.comment,
    type: activity.isLiked ? ReactionType.LIKE : ReactionType.COMMENT,
    user: mapUser(activity.user),
  };
};
