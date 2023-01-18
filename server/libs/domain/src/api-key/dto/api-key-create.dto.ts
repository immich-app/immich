import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class APIKeyCreateDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;
}
