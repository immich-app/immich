import { ApiProperty } from '@nestjs/swagger';

export class TrashResponseDto {
  @ApiProperty({ type: 'integer', description: 'Number of items in trash' })
  count!: number;
}
