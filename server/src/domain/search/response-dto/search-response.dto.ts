import { ApiProperty } from '@nestjs/swagger';
import { AlbumResponseDto } from '../../album/index.js';
import { AssetResponseDto } from '../../asset/index.js';

class SearchFacetCountResponseDto {
  @ApiProperty({ type: 'integer' })
  count!: number;
  value!: string;
}

class SearchFacetResponseDto {
  fieldName!: string;
  counts!: SearchFacetCountResponseDto[];
}

class SearchAlbumResponseDto {
  @ApiProperty({ type: 'integer' })
  total!: number;
  @ApiProperty({ type: 'integer' })
  count!: number;
  items!: AlbumResponseDto[];
  facets!: SearchFacetResponseDto[];
}

class SearchAssetResponseDto {
  @ApiProperty({ type: 'integer' })
  total!: number;
  @ApiProperty({ type: 'integer' })
  count!: number;
  items!: AssetResponseDto[];
  facets!: SearchFacetResponseDto[];
}

export class SearchResponseDto {
  albums!: SearchAlbumResponseDto;
  assets!: SearchAssetResponseDto;
}
