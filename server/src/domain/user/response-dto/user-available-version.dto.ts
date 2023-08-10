import { ApiProperty } from '@nestjs/swagger';

export class AvailableVersionResponseDto {
  availableVersion!: SystemConfigImmichVersion | null;
}
class SystemConfigImmichVersion {
  @ApiProperty({ type: 'integer' })
  major!: number;
  @ApiProperty({ type: 'integer' })
  minor!: number;
  @ApiProperty({ type: 'integer' })
  patch!: number;
}
