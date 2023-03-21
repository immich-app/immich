import { ApiProperty } from '@nestjs/swagger';
import { IServerVersion } from '@app/domain';

export class ServerVersionReponseDto implements IServerVersion {
  @ApiProperty({ type: 'integer' })
  major!: number;
  @ApiProperty({ type: 'integer' })
  minor!: number;
  @ApiProperty({ type: 'integer' })
  patch!: number;
}
