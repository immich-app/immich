import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsPositive, ValidateNested } from 'class-validator';
import { UserPreferences } from 'src/entities/user-metadata.entity';
import { UserAvatarColor } from 'src/enum';
import { Optional, ValidateBoolean } from 'src/validation';

class AvatarUpdate {
  @Optional()
  @IsEnum(UserAvatarColor)
  @ApiProperty({ enumName: 'UserAvatarColor', enum: UserAvatarColor })
  color?: UserAvatarColor;
}

class MemoriesUpdate {
  @ValidateBoolean({ optional: true })
  enabled?: boolean;
}

class RatingsUpdate {
  @ValidateBoolean({ optional: true })
  enabled?: boolean;
}

class FoldersUpdate {
  @ValidateBoolean({ optional: true })
  enabled?: boolean;

  @ValidateBoolean({ optional: true })
  sidebarWeb?: boolean;
}

class PeopleUpdate {
  @ValidateBoolean({ optional: true })
  enabled?: boolean;

  @ValidateBoolean({ optional: true })
  sidebarWeb?: boolean;
}

class TagsUpdate {
  @ValidateBoolean({ optional: true })
  enabled?: boolean;

  @ValidateBoolean({ optional: true })
  sidebarWeb?: boolean;
}

class EmailNotificationsUpdate {
  @ValidateBoolean({ optional: true })
  enabled?: boolean;

  @ValidateBoolean({ optional: true })
  albumInvite?: boolean;

  @ValidateBoolean({ optional: true })
  albumUpdate?: boolean;
}

class DownloadUpdate implements Partial<DownloadResponse> {
  @Optional()
  @IsInt()
  @IsPositive()
  @ApiProperty({ type: 'integer' })
  archiveSize?: number;

  @ValidateBoolean({ optional: true })
  includeEmbeddedVideos?: boolean;
}

class PurchaseUpdate {
  @ValidateBoolean({ optional: true })
  showSupportBadge?: boolean;

  @IsDateString()
  @Optional()
  hideBuyButtonUntil?: string;
}

export class UserPreferencesUpdateDto {
  @Optional()
  @ValidateNested()
  @Type(() => FoldersUpdate)
  folders?: FoldersUpdate;

  @Optional()
  @ValidateNested()
  @Type(() => MemoriesUpdate)
  memories?: MemoriesUpdate;

  @Optional()
  @ValidateNested()
  @Type(() => PeopleUpdate)
  people?: PeopleUpdate;

  @Optional()
  @ValidateNested()
  @Type(() => RatingsUpdate)
  ratings?: RatingsUpdate;

  @Optional()
  @ValidateNested()
  @Type(() => TagsUpdate)
  tags?: TagsUpdate;

  @Optional()
  @ValidateNested()
  @Type(() => AvatarUpdate)
  avatar?: AvatarUpdate;

  @Optional()
  @ValidateNested()
  @Type(() => EmailNotificationsUpdate)
  emailNotifications?: EmailNotificationsUpdate;

  @Optional()
  @ValidateNested()
  @Type(() => DownloadUpdate)
  download?: DownloadUpdate;

  @Optional()
  @ValidateNested()
  @Type(() => PurchaseUpdate)
  purchase?: PurchaseUpdate;
}

class AvatarResponse {
  @ApiProperty({ enumName: 'UserAvatarColor', enum: UserAvatarColor })
  color!: UserAvatarColor;
}

class RatingsResponse {
  enabled: boolean = false;
}

class MemoriesResponse {
  enabled: boolean = true;
}

class FoldersResponse {
  enabled: boolean = false;
  sidebarWeb: boolean = false;
}

class PeopleResponse {
  enabled: boolean = true;
  sidebarWeb: boolean = false;
}

class TagsResponse {
  enabled: boolean = true;
  sidebarWeb: boolean = true;
}

class EmailNotificationsResponse {
  enabled!: boolean;
  albumInvite!: boolean;
  albumUpdate!: boolean;
}

class DownloadResponse {
  @ApiProperty({ type: 'integer' })
  archiveSize!: number;

  includeEmbeddedVideos: boolean = false;
}

class PurchaseResponse {
  showSupportBadge!: boolean;
  hideBuyButtonUntil!: string;
}

export class UserPreferencesResponseDto implements UserPreferences {
  folders!: FoldersResponse;
  memories!: MemoriesResponse;
  people!: PeopleResponse;
  ratings!: RatingsResponse;
  tags!: TagsResponse;
  avatar!: AvatarResponse;
  emailNotifications!: EmailNotificationsResponse;
  download!: DownloadResponse;
  purchase!: PurchaseResponse;
}

export const mapPreferences = (preferences: UserPreferences): UserPreferencesResponseDto => {
  return preferences;
};
