import { ApiProperty } from '@nestjs/swagger';
import { IServerVersion } from 'apps/immich/src/constants/server_version.constant';

export class ServerVersionReponseDto implements IServerVersion {
  @ApiProperty({ type: 'integer' })
  major!: number;
  @ApiProperty({ type: 'integer' })
  minor!: number;
  @ApiProperty({ type: 'integer' })
  patch!: number;
  @ApiProperty({ type: 'integer' })
  build!: number;
}
