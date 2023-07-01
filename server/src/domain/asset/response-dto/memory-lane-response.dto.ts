import { AssetResponseDto } from './asset-response.dto.js';

export class MemoryLaneResponseDto {
  title!: string;
  assets!: AssetResponseDto[];
}
