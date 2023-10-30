import { ActivityEntity } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { ValidateUUID } from '../domain.util';
import { UserDto, mapSimpleUser } from '../user/response-dto';

export class ActivityReponseDto {
  id!: string;
  comment!: string | null;
  createdAt!: Date;
  type!: 'comment' | 'like';
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
  @ValidateUUID()
  assetId!: string;

  @ValidateUUID()
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
    type: activity.isLiked ? 'like' : 'comment',
    user: mapSimpleUser(activity.user),
  };
}

export function mapStatistics(comments: number): StatisticsResponseDto {
  return {
    comments,
  };
}

export function mapActivities(activities: ActivityEntity[]): ActivityReponseDto[] {
  const result: ActivityReponseDto[] = [];
  for (let i = 0; i < activities.length; i++) {
    result.push({
      id: activities[i].id,
      comment: activities[i].comment,
      createdAt: activities[i].createdAt,
      type: activities[i].isLiked ? 'like' : 'comment',
      user: mapSimpleUser(activities[i].user),
    });
  }
  return result;
}
