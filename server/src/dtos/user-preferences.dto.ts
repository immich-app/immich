import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsPositive, ValidateNested } from 'class-validator';
import { AssetOrder, UserAvatarColor } from 'src/enum';
import { UserPreferences } from 'src/types';
import { Optional, ValidateBoolean, ValidateEnum } from 'src/validation';

class AvatarUpdate {
  @ValidateEnum({ enum: UserAvatarColor, name: 'UserAvatarColor', optional: true, description: 'Avatar color' })
  color?: UserAvatarColor;
}

class MemoriesUpdate {
  @ValidateBoolean({ optional: true, description: 'Whether memories are enabled' })
  enabled?: boolean;

  @Optional()
  @IsInt()
  @IsPositive()
  @ApiProperty({ type: 'integer', description: 'Memory duration in seconds' })
  duration?: number;
}

class RatingsUpdate {
  @ValidateBoolean({ optional: true, description: 'Whether ratings are enabled' })
  enabled?: boolean;
}

@ApiSchema({ description: 'Album preferences' })
class AlbumsUpdate {
  @ValidateEnum({ enum: AssetOrder, name: 'AssetOrder', optional: true, description: 'Default asset order for albums' })
  defaultAssetOrder?: AssetOrder;
}

class FoldersUpdate {
  @ValidateBoolean({ optional: true, description: 'Whether folders are enabled' })
  enabled?: boolean;

  @ValidateBoolean({ optional: true, description: 'Whether folders appear in web sidebar' })
  sidebarWeb?: boolean;
}

class PeopleUpdate {
  @ValidateBoolean({ optional: true, description: 'Whether people are enabled' })
  enabled?: boolean;

  @ValidateBoolean({ optional: true, description: 'Whether people appear in web sidebar' })
  sidebarWeb?: boolean;
}

class SharedLinksUpdate {
  @ValidateBoolean({ optional: true, description: 'Whether shared links are enabled' })
  enabled?: boolean;

  @ValidateBoolean({ optional: true, description: 'Whether shared links appear in web sidebar' })
  sidebarWeb?: boolean;
}

class TagsUpdate {
  @ValidateBoolean({ optional: true, description: 'Whether tags are enabled' })
  enabled?: boolean;

  @ValidateBoolean({ optional: true, description: 'Whether tags appear in web sidebar' })
  sidebarWeb?: boolean;
}

class EmailNotificationsUpdate {
  @ValidateBoolean({ optional: true, description: 'Whether email notifications are enabled' })
  enabled?: boolean;

  @ValidateBoolean({ optional: true, description: 'Whether to receive email notifications for album invites' })
  albumInvite?: boolean;

  @ValidateBoolean({ optional: true, description: 'Whether to receive email notifications for album updates' })
  albumUpdate?: boolean;
}

class DownloadUpdate implements Partial<DownloadResponse> {
  @Optional()
  @IsInt()
  @IsPositive()
  @ApiPropertyOptional({ type: 'integer', description: 'Maximum archive size in bytes' })
  archiveSize?: number;

  @ValidateBoolean({ optional: true, description: 'Whether to include embedded videos in downloads' })
  includeEmbeddedVideos?: boolean;
}

class PurchaseUpdate {
  @ValidateBoolean({ optional: true, description: 'Whether to show support badge' })
  showSupportBadge?: boolean;

  @ApiPropertyOptional({ description: 'Date until which to hide buy button' })
  @IsDateString()
  @Optional()
  hideBuyButtonUntil?: string;
}

class CastUpdate {
  @ValidateBoolean({ optional: true, description: 'Whether Google Cast is enabled' })
  gCastEnabled?: boolean;
}

export class UserPreferencesUpdateDto {
  // Description lives on schema to avoid duplication
  @ApiPropertyOptional({ description: undefined })
  @Optional()
  @ValidateNested()
  @Type(() => AlbumsUpdate)
  albums?: AlbumsUpdate;

  // Description lives on schema to avoid duplication
  @ApiPropertyOptional({ description: undefined })
  @Optional()
  @ValidateNested()
  @Type(() => FoldersUpdate)
  folders?: FoldersUpdate;

  // Description lives on schema to avoid duplication
  @ApiPropertyOptional({ description: undefined })
  @Optional()
  @ValidateNested()
  @Type(() => MemoriesUpdate)
  memories?: MemoriesUpdate;

  // Description lives on schema to avoid duplication
  @ApiPropertyOptional({ description: undefined })
  @Optional()
  @ValidateNested()
  @Type(() => PeopleUpdate)
  people?: PeopleUpdate;

  // Description lives on schema to avoid duplication
  @ApiPropertyOptional({ description: undefined })
  @Optional()
  @ValidateNested()
  @Type(() => RatingsUpdate)
  ratings?: RatingsUpdate;

  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined, required: false })
  @Optional()
  @ValidateNested()
  @Type(() => SharedLinksUpdate)
  sharedLinks?: SharedLinksUpdate;

  // Description lives on schema to avoid duplication
  @ApiPropertyOptional({ description: undefined })
  @Optional()
  @ValidateNested()
  @Type(() => TagsUpdate)
  tags?: TagsUpdate;

  // Description lives on schema to avoid duplication
  @ApiPropertyOptional({ description: undefined })
  @Optional()
  @ValidateNested()
  @Type(() => AvatarUpdate)
  avatar?: AvatarUpdate;

  // Description lives on schema to avoid duplication
  @ApiPropertyOptional({ description: undefined })
  @Optional()
  @ValidateNested()
  @Type(() => EmailNotificationsUpdate)
  emailNotifications?: EmailNotificationsUpdate;

  // Description lives on schema to avoid duplication
  @ApiPropertyOptional({ description: undefined })
  @Optional()
  @ValidateNested()
  @Type(() => DownloadUpdate)
  download?: DownloadUpdate;

  // Description lives on schema to avoid duplication
  @ApiPropertyOptional({ description: undefined })
  @Optional()
  @ValidateNested()
  @Type(() => PurchaseUpdate)
  purchase?: PurchaseUpdate;

  // Description lives on schema to avoid duplication
  @ApiPropertyOptional({ description: undefined })
  @Optional()
  @ValidateNested()
  @Type(() => CastUpdate)
  cast?: CastUpdate;
}

class AlbumsResponse {
  @ValidateEnum({ enum: AssetOrder, name: 'AssetOrder', description: 'Default asset order for albums' })
  defaultAssetOrder: AssetOrder = AssetOrder.Desc;
}

class RatingsResponse {
  @ApiProperty({ description: 'Whether ratings are enabled' })
  enabled: boolean = false;
}

class MemoriesResponse {
  @ApiProperty({ description: 'Whether memories are enabled' })
  enabled: boolean = true;

  @ApiProperty({ type: 'integer', description: 'Memory duration in seconds' })
  duration: number = 5;
}

class FoldersResponse {
  @ApiProperty({ description: 'Whether folders are enabled' })
  enabled: boolean = false;
  @ApiProperty({ description: 'Whether folders appear in web sidebar' })
  sidebarWeb: boolean = false;
}

class PeopleResponse {
  @ApiProperty({ description: 'Whether people are enabled' })
  enabled: boolean = true;
  @ApiProperty({ description: 'Whether people appear in web sidebar' })
  sidebarWeb: boolean = false;
}

class TagsResponse {
  @ApiProperty({ description: 'Whether tags are enabled' })
  enabled: boolean = true;
  @ApiProperty({ description: 'Whether tags appear in web sidebar' })
  sidebarWeb: boolean = true;
}

class SharedLinksResponse {
  @ApiProperty({ description: 'Whether shared links are enabled' })
  enabled: boolean = true;
  @ApiProperty({ description: 'Whether shared links appear in web sidebar' })
  sidebarWeb: boolean = false;
}

class EmailNotificationsResponse {
  @ApiProperty({ description: 'Whether email notifications are enabled' })
  enabled!: boolean;
  @ApiProperty({ description: 'Whether to receive email notifications for album invites' })
  albumInvite!: boolean;
  @ApiProperty({ description: 'Whether to receive email notifications for album updates' })
  albumUpdate!: boolean;
}

class DownloadResponse {
  @ApiProperty({ type: 'integer', description: 'Maximum archive size in bytes' })
  archiveSize!: number;

  @ApiProperty({ description: 'Whether to include embedded videos in downloads' })
  includeEmbeddedVideos: boolean = false;
}

class PurchaseResponse {
  @ApiProperty({ description: 'Whether to show support badge' })
  showSupportBadge!: boolean;
  @ApiProperty({ description: 'Date until which to hide buy button' })
  hideBuyButtonUntil!: string;
}

class CastResponse {
  @ApiProperty({ description: 'Whether Google Cast is enabled' })
  gCastEnabled: boolean = false;
}

export class UserPreferencesResponseDto implements UserPreferences {
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  albums!: AlbumsResponse;
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  folders!: FoldersResponse;
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  memories!: MemoriesResponse;
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  people!: PeopleResponse;
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  ratings!: RatingsResponse;
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  sharedLinks!: SharedLinksResponse;
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  tags!: TagsResponse;
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  emailNotifications!: EmailNotificationsResponse;
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  download!: DownloadResponse;
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  purchase!: PurchaseResponse;
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  cast!: CastResponse;
}

export const mapPreferences = (preferences: UserPreferences): UserPreferencesResponseDto => {
  return preferences;
};
