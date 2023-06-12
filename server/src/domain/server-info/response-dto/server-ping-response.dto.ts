import { ApiResponseProperty } from '@nestjs/swagger';

export class ServerPingResponse {
  constructor(res: string) {
    this.res = res;
  }

  @ApiResponseProperty({ type: String, example: 'pong' })
  res!: string;
}
