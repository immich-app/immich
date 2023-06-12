import { ApiProperty } from '@nestjs/swagger';
import { AssetResponseDto } from './asset-response.dto';

export class MemoryLaneResponseDto {
  @ApiProperty({ type: 'integer', format: 'int64' })
  year!: number;

  assets!: AssetResponseDto[];
}
