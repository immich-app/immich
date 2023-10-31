import { ActivityEntity } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { Optional, ValidateUUID } from '../domain.util';
import { UserDto, mapSimpleUser } from '../user/response-dto';

export enum ReactionType {
  COMMENT = 'comment',
  LIKE = 'like',
}

export type MaybeDuplicate<T> = { duplicate: boolean; value: T };

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
    user: mapSimpleUser(activity.user),
  };
}
