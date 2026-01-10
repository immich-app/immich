import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsPositive, ValidateNested } from 'class-validator';
import { AssetOrder, UserAvatarColor } from 'src/enum';
import { UserPreferences } from 'src/types';
import { Optional, ValidateBoolean, ValidateEnum } from 'src/validation';

class AvatarUpdate {
  @ApiPropertyOptional({ description: 'Avatar color', enum: UserAvatarColor })
  @ValidateEnum({ enum: UserAvatarColor, name: 'UserAvatarColor', optional: true })
  color?: UserAvatarColor;
}

class MemoriesUpdate {
  @ApiPropertyOptional({ description: 'Whether memories are enabled', type: Boolean })
  @ValidateBoolean({ optional: true })
  enabled?: boolean;

  @Optional()
  @IsInt()
  @IsPositive()
  @ApiProperty({ type: 'integer', description: 'Memory duration in seconds' })
  duration?: number;
}

class RatingsUpdate {
  @ApiPropertyOptional({ description: 'Whether ratings are enabled', type: Boolean })
  @ValidateBoolean({ optional: true })
  enabled?: boolean;
}

class AlbumsUpdate {
  @ApiPropertyOptional({ description: 'Default asset order for albums', enum: AssetOrder })
  @ValidateEnum({ enum: AssetOrder, name: 'AssetOrder', optional: true })
  defaultAssetOrder?: AssetOrder;
}

class FoldersUpdate {
  @ApiPropertyOptional({ description: 'Whether folders are enabled', type: Boolean })
  @ValidateBoolean({ optional: true })
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Whether folders appear in web sidebar', type: Boolean })
  @ValidateBoolean({ optional: true })
  sidebarWeb?: boolean;
}

class PeopleUpdate {
  @ApiPropertyOptional({ description: 'Whether people are enabled', type: Boolean })
  @ValidateBoolean({ optional: true })
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Whether people appear in web sidebar', type: Boolean })
  @ValidateBoolean({ optional: true })
  sidebarWeb?: boolean;
}

class SharedLinksUpdate {
  @ApiPropertyOptional({ description: 'Whether shared links are enabled', type: Boolean })
  @ValidateBoolean({ optional: true })
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Whether shared links appear in web sidebar', type: Boolean })
  @ValidateBoolean({ optional: true })
  sidebarWeb?: boolean;
}

class TagsUpdate {
  @ApiPropertyOptional({ description: 'Whether tags are enabled', type: Boolean })
  @ValidateBoolean({ optional: true })
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Whether tags appear in web sidebar', type: Boolean })
  @ValidateBoolean({ optional: true })
  sidebarWeb?: boolean;
}

class EmailNotificationsUpdate {
  @ApiPropertyOptional({ description: 'Whether email notifications are enabled', type: Boolean })
  @ValidateBoolean({ optional: true })
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Whether to receive email notifications for album invites', type: Boolean })
  @ValidateBoolean({ optional: true })
  albumInvite?: boolean;

  @ApiPropertyOptional({ description: 'Whether to receive email notifications for album updates', type: Boolean })
  @ValidateBoolean({ optional: true })
  albumUpdate?: boolean;
}

class DownloadUpdate implements Partial<DownloadResponse> {
  @Optional()
  @IsInt()
  @IsPositive()
  @ApiPropertyOptional({ type: 'integer', description: 'Maximum archive size in bytes' })
  archiveSize?: number;

  @ApiPropertyOptional({ description: 'Whether to include embedded videos in downloads', type: Boolean })
  @ValidateBoolean({ optional: true })
  includeEmbeddedVideos?: boolean;
}

class PurchaseUpdate {
  @ApiPropertyOptional({ description: 'Whether to show support badge', type: Boolean })
  @ValidateBoolean({ optional: true })
  showSupportBadge?: boolean;

  @ApiPropertyOptional({ description: 'Date until which to hide buy button (ISO 8601 format)', type: String, format: 'date-time' })
  @IsDateString()
  @Optional()
  hideBuyButtonUntil?: string;
}

class CastUpdate {
  @ApiPropertyOptional({ description: 'Whether Google Cast is enabled', type: Boolean })
  @ValidateBoolean({ optional: true })
  gCastEnabled?: boolean;
}

export class UserPreferencesUpdateDto {
  @ApiPropertyOptional({ description: 'Album preferences', type: AlbumsUpdate })
  @Optional()
  @ValidateNested()
  @Type(() => AlbumsUpdate)
  albums?: AlbumsUpdate;

  @ApiPropertyOptional({ description: 'Folder preferences', type: FoldersUpdate })
  @Optional()
  @ValidateNested()
  @Type(() => FoldersUpdate)
  folders?: FoldersUpdate;

  @ApiPropertyOptional({ description: 'Memory preferences', type: MemoriesUpdate })
  @Optional()
  @ValidateNested()
  @Type(() => MemoriesUpdate)
  memories?: MemoriesUpdate;

  @ApiPropertyOptional({ description: 'People preferences', type: PeopleUpdate })
  @Optional()
  @ValidateNested()
  @Type(() => PeopleUpdate)
  people?: PeopleUpdate;

  @ApiPropertyOptional({ description: 'Rating preferences', type: RatingsUpdate })
  @Optional()
  @ValidateNested()
  @Type(() => RatingsUpdate)
  ratings?: RatingsUpdate;

  @ApiPropertyOptional({ description: 'Shared link preferences', type: SharedLinksUpdate })
  @Optional()
  @ValidateNested()
  @Type(() => SharedLinksUpdate)
  sharedLinks?: SharedLinksUpdate;

  @ApiPropertyOptional({ description: 'Tag preferences', type: TagsUpdate })
  @Optional()
  @ValidateNested()
  @Type(() => TagsUpdate)
  tags?: TagsUpdate;

  @ApiPropertyOptional({ description: 'Avatar preferences', type: AvatarUpdate })
  @Optional()
  @ValidateNested()
  @Type(() => AvatarUpdate)
  avatar?: AvatarUpdate;

  @ApiPropertyOptional({ description: 'Email notification preferences', type: EmailNotificationsUpdate })
  @Optional()
  @ValidateNested()
  @Type(() => EmailNotificationsUpdate)
  emailNotifications?: EmailNotificationsUpdate;

  @ApiPropertyOptional({ description: 'Download preferences', type: DownloadUpdate })
  @Optional()
  @ValidateNested()
  @Type(() => DownloadUpdate)
  download?: DownloadUpdate;

  @ApiPropertyOptional({ description: 'Purchase preferences', type: PurchaseUpdate })
  @Optional()
  @ValidateNested()
  @Type(() => PurchaseUpdate)
  purchase?: PurchaseUpdate;

  @ApiPropertyOptional({ description: 'Cast preferences', type: CastUpdate })
  @Optional()
  @ValidateNested()
  @Type(() => CastUpdate)
  cast?: CastUpdate;
}

class AlbumsResponse {
  @ApiProperty({ description: 'Default asset order for albums', enum: AssetOrder })
  @ValidateEnum({ enum: AssetOrder, name: 'AssetOrder' })
  defaultAssetOrder: AssetOrder = AssetOrder.Desc;
}

class RatingsResponse {
  @ApiProperty({ description: 'Whether ratings are enabled', type: Boolean })
  enabled: boolean = false;
}

class MemoriesResponse {
  @ApiProperty({ description: 'Whether memories are enabled', type: Boolean })
  enabled: boolean = true;

  @ApiProperty({ type: 'integer', description: 'Memory duration in seconds' })
  duration: number = 5;
}

class FoldersResponse {
  @ApiProperty({ description: 'Whether folders are enabled', type: Boolean })
  enabled: boolean = false;
  @ApiProperty({ description: 'Whether folders appear in web sidebar', type: Boolean })
  sidebarWeb: boolean = false;
}

class PeopleResponse {
  @ApiProperty({ description: 'Whether people are enabled', type: Boolean })
  enabled: boolean = true;
  @ApiProperty({ description: 'Whether people appear in web sidebar', type: Boolean })
  sidebarWeb: boolean = false;
}

class TagsResponse {
  @ApiProperty({ description: 'Whether tags are enabled', type: Boolean })
  enabled: boolean = true;
  @ApiProperty({ description: 'Whether tags appear in web sidebar', type: Boolean })
  sidebarWeb: boolean = true;
}

class SharedLinksResponse {
  @ApiProperty({ description: 'Whether shared links are enabled', type: Boolean })
  enabled: boolean = true;
  @ApiProperty({ description: 'Whether shared links appear in web sidebar', type: Boolean })
  sidebarWeb: boolean = false;
}

class EmailNotificationsResponse {
  @ApiProperty({ description: 'Whether email notifications are enabled', type: Boolean })
  enabled!: boolean;
  @ApiProperty({ description: 'Whether to receive email notifications for album invites', type: Boolean })
  albumInvite!: boolean;
  @ApiProperty({ description: 'Whether to receive email notifications for album updates', type: Boolean })
  albumUpdate!: boolean;
}

class DownloadResponse {
  @ApiProperty({ type: 'integer', description: 'Maximum archive size in bytes' })
  archiveSize!: number;

  @ApiProperty({ description: 'Whether to include embedded videos in downloads', type: Boolean })
  includeEmbeddedVideos: boolean = false;
}

class PurchaseResponse {
  @ApiProperty({ description: 'Whether to show support badge', type: Boolean })
  showSupportBadge!: boolean;
  @ApiProperty({ description: 'Date until which to hide buy button (ISO 8601 format)', type: String, format: 'date-time' })
  hideBuyButtonUntil!: string;
}

class CastResponse {
  @ApiProperty({ description: 'Whether Google Cast is enabled', type: Boolean })
  gCastEnabled: boolean = false;
}

export class UserPreferencesResponseDto implements UserPreferences {
  @ApiProperty({ description: 'Album preferences', type: AlbumsResponse })
  albums!: AlbumsResponse;
  @ApiProperty({ description: 'Folder preferences', type: FoldersResponse })
  folders!: FoldersResponse;
  @ApiProperty({ description: 'Memory preferences', type: MemoriesResponse })
  memories!: MemoriesResponse;
  @ApiProperty({ description: 'People preferences', type: PeopleResponse })
  people!: PeopleResponse;
  @ApiProperty({ description: 'Rating preferences', type: RatingsResponse })
  ratings!: RatingsResponse;
  @ApiProperty({ description: 'Shared link preferences', type: SharedLinksResponse })
  sharedLinks!: SharedLinksResponse;
  @ApiProperty({ description: 'Tag preferences', type: TagsResponse })
  tags!: TagsResponse;
  @ApiProperty({ description: 'Email notification preferences', type: EmailNotificationsResponse })
  emailNotifications!: EmailNotificationsResponse;
  @ApiProperty({ description: 'Download preferences', type: DownloadResponse })
  download!: DownloadResponse;
  @ApiProperty({ description: 'Purchase preferences', type: PurchaseResponse })
  purchase!: PurchaseResponse;
  @ApiProperty({ description: 'Cast preferences', type: CastResponse })
  cast!: CastResponse;
}

export const mapPreferences = (preferences: UserPreferences): UserPreferencesResponseDto => {
  return preferences;
};
