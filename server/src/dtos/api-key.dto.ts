import { ArrayMinSize, IsNotEmpty, IsString } from 'class-validator';
import { Permission } from 'src/enum';
import { Optional, ValidateEnum } from 'src/validation';
export class APIKeyCreateDto {
  @IsString()
  @IsNotEmpty()
  @Optional()
  name?: string;

  @ValidateEnum({ enum: Permission, name: 'Permission', each: true })
  @ArrayMinSize(1)
  permissions!: Permission[];
}

export class APIKeyUpdateDto {
  @Optional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ValidateEnum({ enum: Permission, name: 'Permission', each: true, optional: true })
  @ArrayMinSize(1)
  permissions?: Permission[];
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
  @ValidateEnum({ enum: Permission, name: 'Permission', each: true })
  permissions!: Permission[];
}
