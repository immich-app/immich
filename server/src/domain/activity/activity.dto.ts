import { ActivityEntity } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { UserDto, mapSimpleUser } from '../user/response-dto';

export enum ReactionType {
  COMMENT = 'comment',
  LIKE = 'like',
}

export class ActivityReponseDto {
  id!: string;
  comment?: string | null;
  createdAt!: Date;
  type!: ReactionType;
  user!: UserDto;
}

export class StatisticsResponseDto {
  @ApiProperty({ type: 'integer' })
  comments!: number;
}

export class LikeStatusReponseDto {
  value!: boolean;
}

export class ActivityDto {
  @IsString()
  assetId?: string;

  @IsString()
  albumId!: string;
}

export class ActivityFavoriteDto extends ActivityDto {
  @IsBoolean()
  @IsNotEmpty()
  favorite!: boolean;
}

export class ActivityCommentDto extends ActivityDto {
  @IsString()
  @IsNotEmpty()
  comment!: string;
}

export function mapActivity(activity: ActivityEntity): ActivityReponseDto {
  return {
    id: activity.id,
    createdAt: activity.createdAt,
    comment: activity.comment,
    type: activity.isLiked ? ReactionType.LIKE : ReactionType.COMMENT,
    user: mapSimpleUser(activity.user),
  };
}
