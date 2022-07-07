import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto {
  @IsNotEmpty()
  @ApiProperty()
  id?: string;

  @IsOptional()
  @ApiPropertyOptional({ example: 'password' })
  password?: string;

  @IsOptional()
  @ApiPropertyOptional({ example: 'John' })
  firstName?: string;

  @IsOptional()
  @ApiPropertyOptional({ example: 'Doe' })
  lastName?: string;

  @IsOptional()
  @ApiPropertyOptional({ default: false })
  isAdmin?: boolean;

  @IsOptional()
  @ApiPropertyOptional({ default: true })
  shouldChangePassword?: boolean;

  @IsOptional()
  @ApiPropertyOptional()
  profileImagePath?: string;
}
