import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @ApiProperty({ default: 'testuser@email.com' })
  email!: string;

  @IsNotEmpty()
  @ApiProperty({ default: 'password' })
  password!: string;

  @IsNotEmpty()
  @ApiProperty({ default: 'John' })
  firstName!: string;

  @IsNotEmpty()
  @ApiProperty({ default: 'Doe' })
  lastName!: string;

  @IsOptional()
  @ApiProperty({ default: false })
  isAdmin?: boolean;

  @IsOptional()
  @ApiProperty({ default: true })
  shouldChangePassword?: boolean;
}
