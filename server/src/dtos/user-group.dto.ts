import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserAvatarColor } from 'src/enum';
import { ValidateEnum, ValidateUUID } from 'src/validation';

export class UserGroupCreateDto {
  @ApiProperty({ description: 'Group name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ValidateEnum({
    enum: UserAvatarColor,
    name: 'UserAvatarColor',
    description: 'Group color',
    optional: true,
  })
  color?: UserAvatarColor;
}

export class UserGroupUpdateDto {
  @ApiPropertyOptional({ description: 'Group name' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ValidateEnum({
    enum: UserAvatarColor,
    name: 'UserAvatarColor',
    description: 'Group color',
    optional: true,
    nullable: true,
  })
  color?: UserAvatarColor | null;
}

export class UserGroupMemberSetDto {
  @ValidateUUID({ each: true, description: 'User IDs' })
  userIds!: string[];
}

export class UserGroupMemberResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({ description: 'User name' })
  name!: string;

  @ApiProperty({ description: 'User email' })
  email!: string;

  @ApiPropertyOptional({ description: 'Profile image path' })
  profileImagePath?: string;

  @ApiPropertyOptional({ description: 'Avatar color' })
  avatarColor?: string;
}

export class UserGroupResponseDto {
  @ApiProperty({ description: 'Group ID' })
  id!: string;

  @ApiProperty({ description: 'Group name' })
  name!: string;

  @ApiPropertyOptional({ description: 'Group color', enum: UserAvatarColor })
  color?: UserAvatarColor | null;

  @ApiProperty({ description: 'Group origin (manual or oidc)' })
  origin!: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt!: string;

  @ApiProperty({ description: 'Members', type: [UserGroupMemberResponseDto] })
  members!: UserGroupMemberResponseDto[];
}
