import { ActivityEntity } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { ValidateUUID } from '../domain.util';
import { UserDto, mapSimpleUser } from '../user/response-dto';

export enum ReactionType {
  COMMENT = 'comment',
  LIKE = 'like',
}

export class ActivityResponseDto {
  id!: string;
  createdAt!: Date;
  type!: ReactionType;
  user!: UserDto;
  assetId!: string | null;
  comment?: string | null;
}

export class ActivityStatisticsResponseDto {
  @ApiProperty({ type: 'integer' })
  comments!: number;
}

export class ActivityLikeStatusResponseDto {
  value!: boolean;
}

export class ActivityDto {
  @ValidateUUID()
  albumId!: string;

  @ValidateUUID({ optional: true })
  assetId?: string;
}

export class ActivityLikeDto extends ActivityDto {
  @IsBoolean()
  @IsNotEmpty()
  value!: boolean;
}

export class ActivityCommentDto extends ActivityDto {
  @IsString()
  @IsNotEmpty()
  comment!: string;
}

export function mapActivity(activity: ActivityEntity): ActivityResponseDto {
  return {
    id: activity.id,
    assetId: activity.assetId,
    createdAt: activity.createdAt,
    comment: activity.comment,
    type: activity.isLiked ? ReactionType.LIKE : ReactionType.COMMENT,
    user: mapSimpleUser(activity.user),
  };
}
