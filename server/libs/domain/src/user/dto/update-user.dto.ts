import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsNotEmpty()
  @IsUUID('4')
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @IsOptional()
  @IsBoolean()
  shouldChangePassword?: boolean;
}
