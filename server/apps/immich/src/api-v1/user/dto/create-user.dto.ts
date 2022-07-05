import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  email!: string;

  @IsNotEmpty()
  password!: string;

  @IsNotEmpty()
  firstName!: string;

  @IsNotEmpty()
  lastName!: string;

  @IsOptional()
  profileImagePath?: string;

  @IsOptional()
  isAdmin?: boolean;

  @IsOptional()
  shouldChangePassword?: boolean;

  @IsOptional()
  id?: string;
}
