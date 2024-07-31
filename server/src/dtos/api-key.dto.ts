import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Optional } from 'src/validation';
export class APIKeyCreateDto {
  @IsString()
  @IsNotEmpty()
  @Optional()
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
  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt!: string;
  @ApiProperty({ type: 'string', format: 'date-time' })
  updatedAt!: string;
}
