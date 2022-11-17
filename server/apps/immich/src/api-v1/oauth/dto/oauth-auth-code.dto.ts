import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class OAuthCallbackDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  url!: string;
}
