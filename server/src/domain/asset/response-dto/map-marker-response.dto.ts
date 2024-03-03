import { ApiProperty } from '@nestjs/swagger';

export class MapMarkerResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ format: 'double' })
  lat!: number;

  @ApiProperty({ format: 'double' })
  lon!: number;

  @ApiProperty()
  city!: string;

  @ApiProperty()
  state!: string;

  @ApiProperty()
  country!: string;
}
