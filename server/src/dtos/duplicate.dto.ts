import { AssetResponseDto } from 'src/dtos/asset-response.dto';

export class DuplicateResponseDto {
  duplicateId!: string;
  assets!: AssetResponseDto[];
}
