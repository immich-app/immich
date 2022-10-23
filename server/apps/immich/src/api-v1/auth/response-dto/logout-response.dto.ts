import { ApiResponseProperty } from '@nestjs/swagger';

export class LogoutResponseDto {
  constructor(successful: boolean) {
    this.successful = successful;
  }

  @ApiResponseProperty()
  successful!: boolean;
}
