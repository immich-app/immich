import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @ApiProperty({ example: 'testuser@email.com' })
  email!: string;

  @IsNotEmpty()
  @ApiProperty({ example: 'password' })
  password!: string;

  @IsNotEmpty()
  @ApiProperty({ example: 'John' })
  firstName!: string;

  @IsNotEmpty()
  @ApiProperty({ example: 'Doe' })
  lastName!: string;
}
