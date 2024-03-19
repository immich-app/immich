import { ApiProperty } from '@nestjs/swagger';
import { AlbumResponseDto } from 'src/domain/album/album-response.dto';
import { AssetResponseDto } from 'src/domain/asset/response-dto/asset-response.dto';

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
  nextPage!: string | null;
}

export class SearchResponseDto {
  albums!: SearchAlbumResponseDto;
  assets!: SearchAssetResponseDto;
}
