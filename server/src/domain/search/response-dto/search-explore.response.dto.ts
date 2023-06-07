import { AssetResponseDto } from '../../asset';

class SearchExploreItem {
  value!: string;
  data!: AssetResponseDto;
}

export class SearchExploreResponseDto {
  fieldName!: string;
  items!: SearchExploreItem[];
}
