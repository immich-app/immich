import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ description: 'Trash count response' })
export class TrashResponseDto {
  @ApiProperty({ type: 'integer', description: 'Number of items in trash' })
  count!: number;
}
