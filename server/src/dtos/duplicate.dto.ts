import { groupBy } from 'lodash';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';

export class DuplicateResponseDto {
  duplicateId!: string;
  assets!: AssetResponseDto[];
}

export function mapDuplicateResponse(assets: AssetResponseDto[]): DuplicateResponseDto[] {
  const result = [];

  const grouped = groupBy(assets, (a) => a.duplicateId);

  for (const [duplicateId, assets] of Object.entries(grouped)) {
    result.push({ duplicateId, assets });
  }

  return result;
}
