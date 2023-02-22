import { ApiProperty } from '@nestjs/swagger';

export class ValidateAccessTokenResponseDto {
  constructor(authStatus: boolean) {
    this.authStatus = authStatus;
  }

  @ApiProperty({ type: 'boolean' })
  authStatus!: boolean;
}
