import { ApiProperty } from '@nestjs/swagger';

export class TrashResponseDto {
  @ApiProperty({ type: 'integer' })
  count!: number;
}
