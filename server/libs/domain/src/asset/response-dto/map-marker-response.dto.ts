import { ApiProperty } from '@nestjs/swagger';

export class MapMarkerResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  lat!: number;

  @ApiProperty()
  lon!: number;
}
