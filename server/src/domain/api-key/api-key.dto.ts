import { IsNotEmpty, IsString } from 'class-validator';
import { IsOptional } from '../domain.util';
export class APIKeyCreateDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;
}

export class APIKeyUpdateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
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
}
