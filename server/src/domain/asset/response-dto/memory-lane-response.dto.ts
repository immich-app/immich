import { ApiProperty } from '@nestjs/swagger';

export class MemoryLaneResponseDto {
  @ApiProperty({ type: 'integer', format: 'int64' })
  year!: number;

  assets!: string[];
}
