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

class MemoryUpdate {
  @ValidateBoolean({ optional: true })
  enabled?: boolean;
}

class RatingUpdate {
  @ValidateBoolean({ optional: true })
  enabled?: boolean;
}

class FolderUpdate {
  @ValidateBoolean({ optional: true })
  enabled?: boolean;
}

class PeopleUpdate {
  @ValidateBoolean({ optional: true })
  enabled?: boolean;
}

class TagUpdate {
  @ValidateBoolean({ optional: true })
  enabled?: boolean;
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

class MetadataUpdate {
  @Optional()
  @ValidateNested()
  @Type(() => FolderUpdate)
  folder?: FolderUpdate;

  @Optional()
  @ValidateNested()
  @Type(() => MemoryUpdate)
  memory?: MemoryUpdate;

  @Optional()
  @ValidateNested()
  @Type(() => PeopleUpdate)
  people?: PeopleUpdate;

  @Optional()
  @ValidateNested()
  @Type(() => RatingUpdate)
  rating?: RatingUpdate;

  @Optional()
  @ValidateNested()
  @Type(() => TagUpdate)
  tag?: TagUpdate;
}

export class UserPreferencesUpdateDto {
  @Optional()
  @ValidateNested()
  @Type(() => MetadataUpdate)
  metadata?: MetadataUpdate;

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

class RatingResponse {
  enabled: boolean = false;
}

class MemoryResponse {
  enabled!: boolean;
}

class FolderResponse {
  enabled!: boolean;
}

class PeopleResponse {
  enabled!: boolean;
}

class TagResponse {
  enabled!: boolean;
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

class UserMetadataResponse {
  folder!: FolderResponse;
  memory!: MemoryResponse;
  people!: PeopleResponse;
  rating!: RatingResponse;
  tag!: TagResponse;
}

export class UserPreferencesResponseDto implements UserPreferences {
  metadata!: UserMetadataResponse;
  avatar!: AvatarResponse;
  emailNotifications!: EmailNotificationsResponse;
  download!: DownloadResponse;
  purchase!: PurchaseResponse;
}

export const mapPreferences = (preferences: UserPreferences): UserPreferencesResponseDto => {
  return preferences;
};
