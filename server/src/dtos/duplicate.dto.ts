import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';

@ApiSchema({ description: 'Duplicate assets response' })
export class DuplicateResponseDto {
  @ApiProperty({ description: 'Duplicate group ID' })
  duplicateId!: string;
  @ApiProperty({ description: 'Duplicate assets', type: () => [AssetResponseDto] })
  assets!: AssetResponseDto[];
}
