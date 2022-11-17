import { ApiResponseProperty } from '@nestjs/swagger';

export class OAuthConfigResponseDto {
  @ApiResponseProperty()
  enabled!: boolean;

  @ApiResponseProperty()
  url?: string;

  @ApiResponseProperty()
  buttonText?: string;
}
