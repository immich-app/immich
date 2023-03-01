import { AlbumResponseDto } from '../../album';
import { AssetResponseDto } from '../../asset';

class SearchFacetCountResponseDto {
  count!: number;
  value!: string;
}

class SearchFacetResponseDto {
  fieldName!: string;
  counts!: SearchFacetCountResponseDto[];
}

class SearchAlbumResponseDto {
  total!: number;
  count!: number;
  items!: AlbumResponseDto[];
  facets!: SearchFacetResponseDto[];
}

class SearchAssetResponseDto {
  total!: number;
  count!: number;
  items!: AssetResponseDto[];
  facets!: SearchFacetResponseDto[];
}

export class SearchResponseDto {
  albums!: SearchAlbumResponseDto;
  assets!: SearchAssetResponseDto;
}
