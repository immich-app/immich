import { ApiProperty } from '@nestjs/swagger';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';

export class DuplicateResponseDto {
  @ApiProperty({ description: 'Duplicate group ID' })
  duplicateId!: string;
  @ApiProperty({ description: 'Duplicate assets' })
  assets!: AssetResponseDto[];
}
