import { IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  password?: string;

  @IsOptional()
  firstName?: string;

  @IsOptional()
  lastName?: string;

  @IsOptional()
  isAdmin?: boolean;

  @IsOptional()
  shouldChangePassword?: boolean;

  @IsOptional()
  profileImagePath?: string;
}
