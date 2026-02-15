import { createZodDto } from 'nestjs-zod';
import { Activity } from 'src/database';
import { UserResponseSchema } from 'src/dtos/user.dto';
import { UserAvatarColor } from 'src/enum';
import { z } from 'zod';

// Option 1 - reuse existing enum:
export enum ReactionLevel {
  ALBUM = 'album',
  ASSET = 'asset',
}
export const ReactionLevelSchema = z.enum(ReactionLevel).describe('Reaction level').meta({ id: 'ReactionLevel' });

// Option 2 - define inline and access via .enum.XXX:
export enum ReactionType {
  COMMENT = 'comment',
  LIKE = 'like',
}
export const ReactionTypeSchema = z.enum(ReactionType).describe('Reaction type').meta({ id: 'ReactionType' });

export type MaybeDuplicate<T> = { duplicate: boolean; value: T };

const ActivityResponseSchema = z
  .object({
    id: z.uuidv4().describe('Activity ID'),
    createdAt: z.iso.datetime().describe('Creation date'),
    user: UserResponseSchema,
    assetId: z.uuidv4().describe('Asset ID (if activity is for an asset)').nullable(),
    type: ReactionTypeSchema,
    comment: z.string().describe('Comment text (for comment activities)').nullish(),
  })
  .describe('Activity response');

const ActivityStatisticsResponseSchema = z
  .object({
    comments: z.number().int().min(0).describe('Number of comments'),
    likes: z.number().int().min(0).describe('Number of likes'),
  })
  .describe('Activity statistics response');

const ActivitySchema = z
  .object({
    albumId: z.uuidv4().describe('Album ID'),
    assetId: z.uuidv4().describe('Asset ID (if activity is for an asset)').optional(),
  })
  .describe('Activity');

const ActivitySearchSchema = ActivitySchema.extend({
  type: ReactionTypeSchema.optional(),
  level: ReactionLevelSchema.optional(),
  userId: z.uuidv4().describe('Filter by user ID').optional(),
}).describe('Activity search');

const ActivityCreateSchema = ActivitySchema.extend({
  type: ReactionTypeSchema,
  assetId: z.uuidv4().describe('Asset ID (if activity is for an asset)').optional(),
  comment: z.string().describe('Comment text (required if type is comment)').optional(),
})
  .refine((data) => data.type !== ReactionType.COMMENT || (data.comment && data.comment.trim() !== ''), {
    message: 'Comment is required when type is COMMENT',
    path: ['comment'],
  })
  .refine((data) => data.type === ReactionType.COMMENT || !data.comment, {
    message: 'Comment must not be provided when type is not COMMENT',
    path: ['comment'],
  })
  .describe('Activity create');

export const mapActivity = (activity: Activity): ActivityResponseDto => {
  const type = activity.isLiked ? ReactionType.LIKE : ReactionType.COMMENT;

  if (type === ReactionType.COMMENT) {
    return {
      id: activity.id,
      assetId: activity.assetId,
      createdAt: activity.createdAt.toISOString(),
      type: ReactionType.COMMENT,
      user: {
        id: activity.user.id,
        name: activity.user.name,
        email: activity.user.email,
        profileImagePath: activity.user.profileImagePath,
        avatarColor: activity.user.avatarColor ?? UserAvatarColor.Primary,
        profileChangedAt: new Date(activity.user.profileChangedAt).toISOString(),
      },
      comment: activity.comment,
    };
  }

  return {
    id: activity.id,
    assetId: activity.assetId,
    createdAt: activity.createdAt.toISOString(),
    type: ReactionType.LIKE,
    user: {
      id: activity.user.id,
      name: activity.user.name,
      email: activity.user.email,
      profileImagePath: activity.user.profileImagePath,
      avatarColor: activity.user.avatarColor ?? UserAvatarColor.Primary,
      profileChangedAt: new Date(activity.user.profileChangedAt).toISOString(),
    },
    comment: null,
  };
};

export class ActivityResponseDto extends createZodDto(ActivityResponseSchema) {}
export class ActivityCreateDto extends createZodDto(ActivityCreateSchema) {}
export class ActivityDto extends createZodDto(ActivitySchema) {}
export class ActivitySearchDto extends createZodDto(ActivitySearchSchema) {}
export class ActivityStatisticsResponseDto extends createZodDto(ActivityStatisticsResponseSchema) {}
