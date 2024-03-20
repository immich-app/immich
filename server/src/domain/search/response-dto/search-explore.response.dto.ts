import { AssetResponseDto } from 'src/domain/asset/response-dto/asset-response.dto';

class SearchExploreItem {
  value!: string;
  data!: AssetResponseDto;
}

export class SearchExploreResponseDto {
  fieldName!: string;
  items!: SearchExploreItem[];
}
