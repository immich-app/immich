import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, ValidateNested } from 'class-validator';
import { UserAvatarColor, UserPreferences } from 'src/entities/user-metadata.entity';
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

export class UserPreferencesUpdateDto {
  @Optional()
  @ValidateNested()
  @Type(() => AvatarUpdate)
  avatar?: AvatarUpdate;

  @Optional()
  @ValidateNested()
  @Type(() => MemoryUpdate)
  memories?: MemoryUpdate;
}

class AvatarResponse {
  @ApiProperty({ enumName: 'UserAvatarColor', enum: UserAvatarColor })
  color!: UserAvatarColor;
}

class MemoryResponse {
  enabled!: boolean;
}

export class UserPreferencesResponseDto implements UserPreferences {
  memories!: MemoryResponse;
  avatar!: AvatarResponse;
}

export const mapPreferences = (preferences: UserPreferences): UserPreferencesResponseDto => {
  return preferences;
};
