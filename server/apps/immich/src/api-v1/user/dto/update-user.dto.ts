import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsNotEmpty()
  id!: string;

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
