import { ApiProperty } from '@nestjs/swagger';

export class MapMarkerResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ format: 'double' })
  lat!: number;

  @ApiProperty({ format: 'double' })
  lon!: number;
}
