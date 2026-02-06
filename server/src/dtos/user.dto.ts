import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { User, UserAdmin } from 'src/database';
import { UserStatus } from 'src/enum';
import { Optional, ValidateEnum, toEmail } from 'src/validation';

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
