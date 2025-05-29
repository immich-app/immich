import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Permission } from 'src/enum';
import { Optional } from 'src/validation';
export class APIKeyCreateDto {
  @IsString()
  @IsNotEmpty()
  @Optional()
  name?: string;

  @IsEnum(Permission, { each: true })
  @ApiProperty({ enum: Permission, enumName: 'Permission', isArray: true })
  @ArrayMinSize(1)
  permissions!: Permission[];
}

export class APIKeyUpdateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(Permission, { each: true })
  @ApiProperty({ enum: Permission, enumName: 'Permission', isArray: true })
  @ArrayMinSize(1)
  permissions!: Permission[];
}

export class APIKeyCreateResponseDto {
  secret!: string;
  apiKey!: APIKeyResponseDto;
}

export class APIKeyResponseDto {
  id!: string;
  name!: string;
  createdAt!: Date;
  updatedAt!: Date;
  @ApiProperty({ enum: Permission, enumName: 'Permission', isArray: true })
  permissions!: Permission[];
}
