import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { mapUser, UserResponseDto } from 'src/dtos/user.dto';
import { UserEntity } from 'src/entities/user.entity';
import { ActivityItem } from 'src/types';
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
  @ApiProperty({ enumName: 'ReactionType', enum: ReactionType })
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

const isComment = (dto: ActivityCreateDto) => dto.type === ReactionType.COMMENT;

export class ActivityCreateDto extends ActivityDto {
  @IsEnum(ReactionType)
  @ApiProperty({ enumName: 'ReactionType', enum: ReactionType })
  type!: ReactionType;

  @ValidateIf(isComment)
  @IsNotEmpty()
  @IsString()
  comment?: string;
}

export const mapActivity = (activity: ActivityItem): ActivityResponseDto => {
  return {
    id: activity.id,
    assetId: activity.assetId,
    createdAt: activity.createdAt,
    comment: activity.comment,
    type: activity.isLiked ? ReactionType.LIKE : ReactionType.COMMENT,
    user: mapUser(activity.user as unknown as UserEntity),
  };
};
