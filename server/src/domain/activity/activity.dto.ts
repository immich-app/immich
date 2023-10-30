import { ActivityEntity } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { ValidateUUID } from '../domain.util';

export class ActivityReponseDto {
  id!: string | null;
  comment!: string | null;
  createdAt!: Date | null;
  isLiked!: boolean;
  user!: UserCommentDto | null;
}

export class StatisticsResponseDto {
  @ApiProperty({ type: 'integer' })
  comments!: number;
}

export class UserCommentDto {
  id!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  profileImagePath!: string;
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
    isLiked: activity.isLiked,
    user: {
      id: activity.user.id,
      firstName: activity.user.firstName,
      lastName: activity.user.lastName,
      email: activity.user.email,
      profileImagePath: activity.user.profileImagePath,
    },
  };
}

export function mapFavorite(activity: ActivityEntity | null): ActivityReponseDto {
  if (activity)
    return {
      id: activity.id,
      createdAt: activity.createdAt,
      comment: activity.comment,
      isLiked: activity.isLiked,
      user: {
        id: activity.user.id,
        firstName: activity.user.firstName,
        lastName: activity.user.lastName,
        email: activity.user.email,
        profileImagePath: activity.user.profileImagePath,
      },
    };

  return {
    id: null,
    createdAt: null,
    comment: null,
    isLiked: false,
    user: null,
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
      isLiked: activities[i].isLiked,
      user: {
        id: activities[i].user.id,
        firstName: activities[i].user.firstName,
        lastName: activities[i].user.lastName,
        email: activities[i].user.email,
        profileImagePath: activities[i].user.profileImagePath,
      },
    });
  }
  return result;
}
