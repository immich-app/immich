import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { ArrayMinSize, IsNotEmpty, IsString } from 'class-validator';
import { Permission } from 'src/enum';
import { Optional, ValidateEnum } from 'src/validation';

@ApiSchema({ description: 'API key creation request with name and permissions' })
export class APIKeyCreateDto {
  @ApiPropertyOptional({ description: 'API key name' })
  @IsString()
  @IsNotEmpty()
  @Optional()
  name?: string;

  @ApiProperty({ description: 'List of permissions', enum: Permission, isArray: true })
  @ValidateEnum({ enum: Permission, name: 'Permission', each: true })
  @ArrayMinSize(1)
  permissions!: Permission[];
}

@ApiSchema({ description: 'API key update request with optional name and permissions' })
export class APIKeyUpdateDto {
  @ApiPropertyOptional({ description: 'API key name' })
  @Optional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'List of permissions', enum: Permission, isArray: true })
  @ValidateEnum({ enum: Permission, name: 'Permission', each: true, optional: true })
  @ArrayMinSize(1)
  permissions?: Permission[];
}

@ApiSchema({ description: 'API key response with permissions' })
export class APIKeyResponseDto {
  @ApiProperty({ description: 'API key ID' })
  id!: string;
  @ApiProperty({ description: 'API key name' })
  name!: string;
  @ApiProperty({ description: 'Creation date' })
  createdAt!: Date;
  @ApiProperty({ description: 'Last update date' })
  updatedAt!: Date;
  @ApiProperty({ description: 'List of permissions', enum: Permission, isArray: true })
  @ValidateEnum({ enum: Permission, name: 'Permission', each: true })
  permissions!: Permission[];
}

@ApiSchema({ description: 'API key creation response with secret' })
export class APIKeyCreateResponseDto {
  @ApiProperty({ description: 'API key secret (only shown once)' })
  secret!: string;
  @ApiProperty({ description: 'API key details' })
  apiKey!: APIKeyResponseDto;
}
