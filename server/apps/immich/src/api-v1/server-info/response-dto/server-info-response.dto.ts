import { ApiProperty } from '@nestjs/swagger';

export class ServerInfoResponseDto {
  diskSize!: string;
  diskUse!: string;
  diskAvailable!: string;

  @ApiProperty({ type: 'integer' })
  diskSizeRaw!: number;

  @ApiProperty({ type: 'integer' })
  diskUseRaw!: number;

  @ApiProperty({ type: 'integer' })
  diskAvailableRaw!: number;

  @ApiProperty({ type: 'number', format: 'float' })
  diskUsagePercentage!: number;
}
