import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { UserResponseDto, mapUser } from 'src/dtos/user.dto';
import { ActivityEntity } from 'src/entities/activity.entity';
import { Optional, ValidateUUID } from 'src/validation';

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
  type!: ReactionType;
  user!: UserResponseDto;
  assetId!: string | null;
  comment?: string | null;
}

export class ActivityStatisticsResponseDto {
  @ApiProperty({ type: 'integer' })
  comments!: number;
}

export class ActivityDto {
  @ValidateUUID()
  albumId!: string;

  @ValidateUUID({ optional: true })
  assetId?: string;
}

export class ActivitySearchDto extends ActivityDto {
  @IsEnum(ReactionType)
  @Optional()
  @ApiProperty({ enumName: 'ReactionType', enum: ReactionType })
  type?: ReactionType;

  @IsEnum(ReactionLevel)
  @Optional()
  @ApiProperty({ enumName: 'ReactionLevel', enum: ReactionLevel })
  level?: ReactionLevel;

  @ValidateUUID({ optional: true })
  userId?: string;
}

const isComment = (dto: ActivityCreateDto) => dto.type === 'comment';

export class ActivityCreateDto extends ActivityDto {
  @IsEnum(ReactionType)
  @ApiProperty({ enumName: 'ReactionType', enum: ReactionType })
  type!: ReactionType;

  @ValidateIf(isComment)
  @IsNotEmpty()
  @IsString()
  comment?: string;
}

export function mapActivity(activity: ActivityEntity): ActivityResponseDto {
  return {
    id: activity.id,
    assetId: activity.assetId,
    createdAt: activity.createdAt,
    comment: activity.comment,
    type: activity.isLiked ? ReactionType.LIKE : ReactionType.COMMENT,
    user: mapUser(activity.user),
  };
}
