import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @ApiProperty({ required: true, example: 'testuser@email.com' })
  email!: string;

  @IsNotEmpty()
  @ApiProperty({ required: true, example: 'password' })
  password!: string;

  @IsNotEmpty()
  @ApiProperty({ required: true, example: 'John' })
  firstName!: string;

  @IsNotEmpty()
  @ApiProperty({ required: true, example: 'Doe' })
  lastName!: string;

  @IsOptional()
  @ApiProperty({ required: false, default: false })
  isAdmin?: boolean;

  @IsOptional()
  @ApiProperty({ required: false, default: true })
  shouldChangePassword?: boolean;
}
