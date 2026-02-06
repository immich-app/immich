import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { User, UserAdmin } from 'src/database';
import { UserStatus } from 'src/enum';
import { Optional, ValidateBoolean, ValidateEnum, ValidateUUID, toEmail } from 'src/validation';

export class UserUpdateMeDto {
  @ApiPropertyOptional({ description: 'User email' })
  @Optional()
  @IsEmail({ require_tld: false })
  @Transform(toEmail)
  email?: string;

  @ApiPropertyOptional({ description: 'User name' })
  @Optional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id!: string;
  @ApiProperty({ description: 'User name' })
  name!: string;
  @ApiProperty({ description: 'User email' })
  email!: string;
}

export const mapUser = (entity: User | UserAdmin): UserResponseDto => {
  return {
    id: entity.id,
    email: entity.email,
    name: entity.name,
  };
};

export class UserAdminSearchDto {
  @ValidateBoolean({ optional: true, description: 'Include deleted users' })
  withDeleted?: boolean;

  @ValidateUUID({ optional: true, description: 'User ID filter' })
  id?: string;
}

export class UserAdminCreateDto {
  @ApiProperty({ description: 'User email' })
  @IsEmail({ require_tld: false })
  @Transform(toEmail)
  email!: string;

  @ApiProperty({ description: 'User password' })
  @IsString()
  password!: string;

  @ApiProperty({ description: 'User name' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ValidateBoolean({ optional: true, description: 'Require password change on next login' })
  shouldChangePassword?: boolean;

  @ValidateBoolean({ optional: true, description: 'Grant admin privileges' })
  isAdmin?: boolean;
}

export class UserAdminUpdateDto {
  @ApiPropertyOptional({ description: 'User email' })
  @Optional()
  @IsEmail({ require_tld: false })
  @Transform(toEmail)
  email?: string;

  @ApiPropertyOptional({ description: 'User password' })
  @Optional()
  @IsNotEmpty()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: 'User name' })
  @Optional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ValidateBoolean({ optional: true, description: 'Require password change on next login' })
  shouldChangePassword?: boolean;

  @ValidateBoolean({ optional: true, description: 'Grant admin privileges' })
  isAdmin?: boolean;
}

export class UserAdminDeleteDto {
  @ValidateBoolean({ optional: true, description: 'Force delete' })
  force?: boolean;
}

export class UserAdminResponseDto extends UserResponseDto {
  @ApiProperty({ description: 'Require password change on next login' })
  shouldChangePassword!: boolean;
  @ApiProperty({ description: 'Is admin user' })
  isAdmin!: boolean;
  @ApiProperty({ description: 'Creation date' })
  createdAt!: Date;
  @ApiProperty({ description: 'Deletion date' })
  deletedAt!: Date | null;
  @ApiProperty({ description: 'Last update date' })
  updatedAt!: Date;
  @ValidateEnum({ enum: UserStatus, name: 'UserStatus', description: 'User status' })
  status!: string;
}

export function mapUserAdmin(entity: UserAdmin): UserAdminResponseDto {
  return {
    ...mapUser(entity),
    shouldChangePassword: entity.shouldChangePassword,
    isAdmin: entity.isAdmin,
    createdAt: entity.createdAt,
    deletedAt: entity.deletedAt,
    updatedAt: entity.updatedAt,
    status: entity.status,
  };
}
