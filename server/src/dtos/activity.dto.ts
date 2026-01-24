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
  @ApiProperty({ description: 'Activity type', enum: ReactionType })
  @ValidateEnum({ enum: ReactionType, name: 'ReactionType' })
  type!: ReactionType;
  @ApiProperty({ description: 'User who created the activity', type: () => UserResponseDto })
  user!: UserResponseDto;
  @ApiPropertyOptional({ description: 'Asset ID (if activity is for an asset)', nullable: true })
  assetId!: string | null;
  @ApiPropertyOptional({ description: 'Comment text (for comment activities)', nullable: true })
  comment?: string | null;
}

export class ActivityStatisticsResponseDto {
  @ApiProperty({ type: 'integer', description: 'Number of comments' })
  comments!: number;

  @ApiProperty({ type: 'integer', description: 'Number of likes' })
  likes!: number;
}

export class ActivityDto {
  @ApiProperty({ description: 'Album ID' })
  @ValidateUUID()
  albumId!: string;

  @ApiPropertyOptional({ description: 'Asset ID (if activity is for an asset)' })
  @ValidateUUID({ optional: true })
  assetId?: string;
}

export class ActivitySearchDto extends ActivityDto {
  @ApiPropertyOptional({ description: 'Filter by activity type', enum: ReactionType })
  @ValidateEnum({ enum: ReactionType, name: 'ReactionType', optional: true })
  type?: ReactionType;

  @ApiPropertyOptional({ description: 'Filter by activity level', enum: ReactionLevel })
  @ValidateEnum({ enum: ReactionLevel, name: 'ReactionLevel', optional: true })
  level?: ReactionLevel;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @ValidateUUID({ optional: true })
  userId?: string;
}

const isComment = (dto: ActivityCreateDto) => dto.type === ReactionType.COMMENT;

export class ActivityCreateDto extends ActivityDto {
  @ApiProperty({ description: 'Activity type (like or comment)', enum: ReactionType })
  @ValidateEnum({ enum: ReactionType, name: 'ReactionType' })
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
