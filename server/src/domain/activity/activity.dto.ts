import { ActivityEntity } from '@app/infra/entities';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class ActivityReponseDto {
  id!: string | null;
  comment!: string | null;
  createdAt!: Date | null;
  isFavorite!: boolean;
  user!: UserCommentDto | null;
}

export class StatisticsResponseDto {
  comments!: number;
}

export class UserCommentDto {
  id!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  profileImagePath!: string;
}

export class ActivityFavoriteDto {
  @IsBoolean()
  @IsNotEmpty()
  favorite!: boolean;
}

export class FavoriteDto {
  @IsBoolean()
  @IsNotEmpty()
  favorite!: boolean;
}

export class ActivityCommentDto {
  @IsString()
  @IsNotEmpty()
  comment!: string;
}

export function mapActivity(activity: ActivityEntity): ActivityReponseDto {
  return {
    id: activity.id,
    createdAt: activity.createdAt,
    comment: activity.comment,
    isFavorite: activity.isFavorite,
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
      isFavorite: activity.isFavorite,
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
    isFavorite: false,
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
      isFavorite: activities[i].isFavorite,
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
