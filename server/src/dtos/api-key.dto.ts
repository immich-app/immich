import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsNotEmpty, IsString } from 'class-validator';
import { Permission } from 'src/enum';
import { Optional, ValidateEnum } from 'src/validation';

export class APIKeyCreateDto {
  @ApiPropertyOptional({ description: 'API key name' })
  @IsString()
  @IsNotEmpty()
  @Optional()
  name?: string;

  @ValidateEnum({ enum: Permission, name: 'Permission', each: true, description: 'List of permissions' })
  @ArrayMinSize(1)
  permissions!: Permission[];
}

export class APIKeyUpdateDto {
  @ApiPropertyOptional({ description: 'API key name' })
  @Optional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ValidateEnum({
    enum: Permission,
    name: 'Permission',
    description: 'List of permissions',
    each: true,
    optional: true,
  })
  @ArrayMinSize(1)
  permissions?: Permission[];
}

export class APIKeyResponseDto {
  @ApiProperty({ description: 'API key ID' })
  id!: string;
  @ApiProperty({ description: 'API key name' })
  name!: string;
  @ApiProperty({ description: 'Creation date' })
  createdAt!: Date;
  @ApiProperty({ description: 'Last update date' })
  updatedAt!: Date;
  @ValidateEnum({ enum: Permission, name: 'Permission', each: true, description: 'List of permissions' })
  permissions!: Permission[];
}

export class APIKeyCreateResponseDto {
  @ApiProperty({ description: 'API key secret (only shown once)' })
  secret!: string;
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  apiKey!: APIKeyResponseDto;
}
