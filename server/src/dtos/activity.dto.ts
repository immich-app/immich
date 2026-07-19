import { createZodDto } from 'nestjs-zod';
import { Activity, AssetAddition } from 'src/database';
import { mapUser, UserResponseSchema } from 'src/dtos/user.dto';
import { AssetTypeSchema } from 'src/enum';
import { isoDatetimeToDate, stringToBool } from 'src/validation';
import z from 'zod';

export enum ReactionLevel {
  ALBUM = 'album',
  ASSET = 'asset',
}
const ReactionLevelSchema = z.enum(ReactionLevel).describe('Reaction level').meta({ id: 'ReactionLevel' });

export enum ReactionType {
  COMMENT = 'comment',
  LIKE = 'like',
  ASSET_ADDED = 'asset_added',
}
const ReactionTypeSchema = z.enum(ReactionType).describe('Reaction type').meta({ id: 'ReactionType' });

export type MaybeDuplicate<T> = { duplicate: boolean; value: T };

const ActivityResponseSchema = z
  .object({
    id: z.string().describe('Activity ID'),
    createdAt: isoDatetimeToDate.describe('Creation date'),
    user: UserResponseSchema,
    assetId: z.uuidv4().nullable().describe('Asset ID (if activity is for an asset)'),
    type: ReactionTypeSchema,
    comment: z.string().nullish().describe('Comment text (for comment activities)'),
    assetType: AssetTypeSchema.nullish().describe('Asset type (for asset_added activities)'),
    groupId: z
      .string()
      .nullish()
      .describe('Grouping key shared by additions made in one batch (for asset_added activities)'),
  })
  .meta({ id: 'ActivityResponseDto' });

const ActivityStatisticsResponseSchema = z
  .object({
    comments: z.int().min(0).describe('Number of comments'),
    likes: z.int().min(0).describe('Number of likes'),
  })
  .meta({ id: 'ActivityStatisticsResponseDto' });

const ActivitySchema = z.object({
  albumId: z.uuidv4().describe('Album ID'),
  assetId: z.uuidv4().optional().describe('Asset ID (if activity is for an asset)'),
});

const ActivitySearchSchema = ActivitySchema.extend({
  type: ReactionTypeSchema.optional(),
  level: ReactionLevelSchema.optional(),
  userId: z.uuidv4().optional().describe('Filter by user ID'),
  withAdditions: stringToBool.optional().describe('Include asset_added activities (opt-in)'),
});

const ActivityCreateSchema = ActivitySchema.extend({
  type: ReactionTypeSchema,
  assetId: z.uuidv4().optional().describe('Asset ID (if activity is for an asset)'),
  comment: z.string().optional().describe('Comment text (required if type is comment)'),
})
  .refine((data) => data.type === ReactionType.ASSET_ADDED, {
    error: 'Asset-added activities cannot be created directly',
    path: ['type'],
  })
  .refine((data) => data.type !== ReactionType.COMMENT || (data.comment && data.comment.trim() !== ''), {
    error: 'Comment is required when type is COMMENT',
    path: ['comment'],
  })
  .refine((data) => data.type === ReactionType.COMMENT || !data.comment, {
    error: 'Comment must not be provided when type is not COMMENT',
    path: ['comment'],
  })
  .describe('Activity create');

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

// make a synthetic ID for asset additions because they do not have their own rows in the activity table
const ASSET_ADDITION_ID_PREFIX = `${ReactionType.ASSET_ADDED}|`;
export const buildAssetAdditionId = (albumId: string, assetId: string) =>
  `${ASSET_ADDITION_ID_PREFIX}${albumId}|${assetId}`;

export const mapAssetAddition = (row: AssetAddition): ActivityResponseDto => {
  return {
    id: buildAssetAdditionId(row.albumId, row.assetId),
    assetId: row.assetId,
    assetType: row.assetType,
    createdAt: row.createdAt,
    comment: null,
    type: ReactionType.ASSET_ADDED,
    groupId: `${ASSET_ADDITION_ID_PREFIX}${row.albumId}|${row.user.id}|${row.createdAt.toISOString()}`,
    user: mapUser(row.user),
  };
};

export class ActivityResponseDto extends createZodDto(ActivityResponseSchema) {}
export class ActivityCreateDto extends createZodDto(ActivityCreateSchema) {}
export class ActivityDto extends createZodDto(ActivitySchema) {}
export class ActivitySearchDto extends createZodDto(ActivitySearchSchema) {}
export class ActivityStatisticsResponseDto extends createZodDto(ActivityStatisticsResponseSchema) {}
