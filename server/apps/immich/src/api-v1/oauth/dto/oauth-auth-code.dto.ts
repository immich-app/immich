import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class OAuthCallbackDto {
  @IsNotEmpty()
  @ApiProperty()
  url!: string;
}
