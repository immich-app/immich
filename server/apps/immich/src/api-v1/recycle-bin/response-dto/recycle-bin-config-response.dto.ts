import { ApiProperty } from '@nestjs/swagger';

export class RecycleBinConfigResponseDto {
  @ApiProperty()
  enabled!: boolean;

  @ApiProperty()
  days!: string;
}
