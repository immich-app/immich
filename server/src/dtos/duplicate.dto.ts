import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { PaginationResult } from 'src/utils/pagination';

class DuplicateItem {
  duplicateId!: string;
  assets!: AssetResponseDto[];
}

export class DuplicateResponseDto implements PaginationResult<DuplicateItem> {
  items!: DuplicateItem[];
  hasNextPage!: boolean;
  totalPages!: number;
  totalItems!: number;
}
