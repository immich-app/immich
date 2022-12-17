import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsEmail } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase())
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

export class CreateAdminDto extends CreateUserDto {
  @IsNotEmpty()
  isAdmin!: true;
}

export class CreateUserOauthDto {
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase())
  @ApiProperty({ example: 'testuser@email.com' })
  email!: string;

  @IsNotEmpty()
  oauthId!: string;

  @ApiProperty({ example: 'John' })
  firstName?: string;

  @ApiProperty({ example: 'Doe' })
  lastName?: string;
}
