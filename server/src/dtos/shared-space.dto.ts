import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { SharedSpaceRole, UserAvatarColor } from 'src/enum';
import { ValidateBoolean, ValidateEnum, ValidateUUID } from 'src/validation';

export class SharedSpaceCreateDto {
  @ApiProperty({ description: 'Space name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ description: 'Space description' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ValidateEnum({
    enum: UserAvatarColor,
    name: 'UserAvatarColor',
    description: 'Space color',
    optional: true,
    default: UserAvatarColor.Primary,
  })
  color?: UserAvatarColor;
}

export class SharedSpaceUpdateDto {
  @ApiPropertyOptional({ description: 'Space name' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Space description' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ValidateUUID({ optional: true, nullable: true, description: 'Thumbnail asset ID' })
  thumbnailAssetId?: string | null;

  @ApiPropertyOptional({ description: 'Vertical crop position for cover photo (0-100)', type: 'integer' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  thumbnailCropY?: number | null;

  @ValidateEnum({
    enum: UserAvatarColor,
    name: 'UserAvatarColor',
    description: 'Space color',
    optional: true,
  })
  color?: UserAvatarColor;

  @ValidateBoolean({ optional: true, description: 'Enable face recognition for this space' })
  faceRecognitionEnabled?: boolean;
}

export class SharedSpaceMemberCreateDto {
  @ValidateUUID({ description: 'User ID' })
  userId!: string;

  @ValidateEnum({
    enum: SharedSpaceRole,
    name: 'SharedSpaceRole',
    description: 'Member role',
    optional: true,
    default: SharedSpaceRole.Viewer,
  })
  role?: SharedSpaceRole;
}

export class SharedSpaceMemberUpdateDto {
  @ValidateEnum({ enum: SharedSpaceRole, name: 'SharedSpaceRole', description: 'Member role' })
  role!: SharedSpaceRole;
}

export class SharedSpaceMemberResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({ description: 'User name' })
  name!: string;

  @ApiProperty({ description: 'User email' })
  email!: string;

  @ApiProperty({ description: 'Member role', enum: SharedSpaceRole })
  role!: string;

  @ApiProperty({ description: 'Join date' })
  joinedAt!: string;

  @ApiPropertyOptional({ description: 'Profile image path' })
  profileImagePath?: string;

  @ApiPropertyOptional({ description: 'Profile change date' })
  profileChangedAt?: string;

  @ApiPropertyOptional({ description: 'Avatar color' })
  avatarColor?: string;

  @ApiProperty({ description: 'Show space assets in timeline' })
  showInTimeline!: boolean;

  @ApiPropertyOptional({ description: 'Number of photos contributed by this member' })
  contributionCount?: number;

  @ApiPropertyOptional({ description: 'Last time this member added a photo' })
  lastActiveAt?: string | null;

  @ApiPropertyOptional({ description: 'Most recently added asset ID by this member' })
  recentAssetId?: string | null;
}

export class SharedSpaceLinkedLibraryDto {
  @ApiProperty()
  libraryId!: string;

  @ApiProperty()
  libraryName!: string;

  @ApiPropertyOptional()
  addedById!: string | null;

  @ApiProperty()
  createdAt!: Date;
}

export class SharedSpaceResponseDto {
  @ApiProperty({ description: 'Space ID' })
  id!: string;

  @ApiProperty({ description: 'Space name' })
  name!: string;

  @ApiPropertyOptional({ description: 'Space description' })
  description?: string | null;

  @ApiProperty({ description: 'Creator user ID' })
  createdById!: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt!: string;

  @ApiProperty({ description: 'Last update date' })
  updatedAt!: string;

  @ApiPropertyOptional({ description: 'Number of members' })
  memberCount?: number;

  @ApiPropertyOptional({ description: 'Number of assets' })
  assetCount?: number;

  @ApiPropertyOptional({ description: 'Thumbnail asset ID' })
  thumbnailAssetId?: string | null;

  @ApiPropertyOptional({ description: 'Vertical crop position for cover photo (0-100)' })
  thumbnailCropY?: number | null;

  @ApiPropertyOptional({ description: 'Space color', enum: UserAvatarColor })
  color?: UserAvatarColor | null;

  @ApiPropertyOptional({ description: 'Whether face recognition is enabled for this space' })
  faceRecognitionEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Last activity timestamp (most recent asset add)' })
  lastActivityAt?: string | null;

  @ApiPropertyOptional({ description: 'Recent asset IDs for collage display (up to 4)', type: [String] })
  recentAssetIds?: string[];

  @ApiPropertyOptional({ description: 'Thumbhashes for recent assets (parallel array)', type: [String] })
  recentAssetThumbhashes?: (string | null)[];

  @ApiPropertyOptional({ description: 'Space members (summary)', type: [SharedSpaceMemberResponseDto] })
  members?: SharedSpaceMemberResponseDto[];

  @ApiPropertyOptional({ type: [SharedSpaceLinkedLibraryDto] })
  linkedLibraries?: SharedSpaceLinkedLibraryDto[];

  @ApiPropertyOptional({ description: 'Number of new assets since last viewed' })
  newAssetCount?: number;

  @ApiPropertyOptional({ description: 'Last contributor since last viewed' })
  lastContributor?: { id: string; name: string } | null;

  @ApiPropertyOptional({ description: 'When the current user last viewed this space' })
  lastViewedAt?: string | null;
}

export class SharedSpaceMemberTimelineDto {
  @ApiProperty({ description: 'Show space assets in personal timeline' })
  @IsNotEmpty()
  showInTimeline!: boolean;
}

export class SharedSpaceLibraryLinkDto {
  @ValidateUUID({ description: 'Library ID' })
  libraryId!: string;
}

export class SharedSpaceAssetAddDto {
  @ValidateUUID({ each: true, description: 'Asset IDs' })
  assetIds!: string[];
}

export class SharedSpaceAssetRemoveDto {
  @ValidateUUID({ each: true, description: 'Asset IDs' })
  assetIds!: string[];
}

export class SharedSpaceActivityQueryDto {
  @ApiPropertyOptional({ description: 'Number of items to return', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Number of items to skip', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

export class SharedSpaceActivityResponseDto {
  @ApiProperty({ description: 'Activity ID' })
  id!: string;

  @ApiProperty({ description: 'Activity type' })
  type!: string;

  @ApiProperty({ description: 'Event-specific data' })
  data!: Record<string, unknown>;

  @ApiProperty({ description: 'When the event occurred' })
  createdAt!: string;

  @ApiPropertyOptional({ description: 'User ID who performed the action' })
  userId?: string | null;

  @ApiPropertyOptional({ description: 'User name' })
  userName?: string | null;

  @ApiPropertyOptional({ description: 'User email' })
  userEmail?: string | null;

  @ApiPropertyOptional({ description: 'User profile image path' })
  userProfileImagePath?: string | null;

  @ApiPropertyOptional({ description: 'User avatar color' })
  userAvatarColor?: string | null;
}
