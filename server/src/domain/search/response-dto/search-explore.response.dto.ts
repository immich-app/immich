import { AssetResponseDto } from '../../asset/index.js';

class SearchExploreItem {
  value!: string;
  data!: AssetResponseDto;
}

export class SearchExploreResponseDto {
  fieldName!: string;
  items!: SearchExploreItem[];
}
