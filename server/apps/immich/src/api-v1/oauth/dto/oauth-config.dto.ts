import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class OAuthConfigDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  redirectUri!: string;
}
