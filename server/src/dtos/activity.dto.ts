import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ description: 'Activity ID' })
  id!: string;
  @ApiProperty({ description: 'Creation date', format: 'date-time' })
  createdAt!: Date;
  @ValidateEnum({ enum: ReactionType, name: 'ReactionType', description: 'Activity type' })
  type!: ReactionType;
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  user!: UserResponseDto;
  @ApiProperty({ description: 'Asset ID (if activity is for an asset)' })
  assetId!: string | null;
  @ApiPropertyOptional({ description: 'Comment text (for comment activities)' })
  comment?: string | null;
}

export class ActivityStatisticsResponseDto {
  @ApiProperty({ type: 'integer', description: 'Number of comments' })
  comments!: number;

  @ApiProperty({ type: 'integer', description: 'Number of likes' })
  likes!: number;
}

export class ActivityDto {
  @ValidateUUID({ description: 'Album ID' })
  albumId!: string;

  @ValidateUUID({ optional: true, description: 'Asset ID (if activity is for an asset)' })
  assetId?: string;
}

export class ActivitySearchDto extends ActivityDto {
  @ValidateEnum({ enum: ReactionType, name: 'ReactionType', description: 'Filter by activity type', optional: true })
  type?: ReactionType;

  @ValidateEnum({ enum: ReactionLevel, name: 'ReactionLevel', description: 'Filter by activity level', optional: true })
  level?: ReactionLevel;

  @ValidateUUID({ optional: true, description: 'Filter by user ID' })
  userId?: string;
}

const isComment = (dto: ActivityCreateDto) => dto.type === ReactionType.COMMENT;

export class ActivityCreateDto extends ActivityDto {
  @ValidateEnum({ enum: ReactionType, name: 'ReactionType', description: 'Activity type (like or comment)' })
  type!: ReactionType;

  @ApiPropertyOptional({ description: 'Comment text (required if type is comment)' })
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
