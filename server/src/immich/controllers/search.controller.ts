import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssetResponseDto } from 'src/domain/asset/response-dto/asset-response.dto';
import { AuthDto } from 'src/domain/auth/auth.dto';
import { PersonResponseDto } from 'src/domain/person/person.dto';
import { SearchSuggestionRequestDto } from 'src/domain/search/dto/search-suggestion.dto';
import {
  MetadataSearchDto,
  PlacesResponseDto,
  SearchDto,
  SearchPeopleDto,
  SearchPlacesDto,
  SmartSearchDto,
} from 'src/domain/search/dto/search.dto';
import { SearchExploreResponseDto } from 'src/domain/search/response-dto/search-explore.response.dto';
import { SearchResponseDto } from 'src/domain/search/response-dto/search-response.dto';
import { SearchService } from 'src/domain/search/search.service';
import { Auth, Authenticated } from 'src/immich/app.guard';

@ApiTags('Search')
@Controller('search')
@Authenticated()
export class SearchController {
  constructor(private service: SearchService) {}

  @Get()
  @ApiOperation({ deprecated: true })
  search(@Auth() auth: AuthDto, @Query() dto: SearchDto): Promise<SearchResponseDto> {
    return this.service.search(auth, dto);
  }

  @Post('metadata')
  @HttpCode(HttpStatus.OK)
  searchMetadata(@Auth() auth: AuthDto, @Body() dto: MetadataSearchDto): Promise<SearchResponseDto> {
    return this.service.searchMetadata(auth, dto);
  }

  @Post('smart')
  @HttpCode(HttpStatus.OK)
  searchSmart(@Auth() auth: AuthDto, @Body() dto: SmartSearchDto): Promise<SearchResponseDto> {
    return this.service.searchSmart(auth, dto);
  }

  @Get('explore')
  getExploreData(@Auth() auth: AuthDto): Promise<SearchExploreResponseDto[]> {
    return this.service.getExploreData(auth) as Promise<SearchExploreResponseDto[]>;
  }

  @Get('person')
  searchPerson(@Auth() auth: AuthDto, @Query() dto: SearchPeopleDto): Promise<PersonResponseDto[]> {
    return this.service.searchPerson(auth, dto);
  }

  @Get('places')
  searchPlaces(@Query() dto: SearchPlacesDto): Promise<PlacesResponseDto[]> {
    return this.service.searchPlaces(dto);
  }

  @Get('cities')
  getAssetsByCity(@Auth() auth: AuthDto): Promise<AssetResponseDto[]> {
    return this.service.getAssetsByCity(auth);
  }

  @Get('suggestions')
  getSearchSuggestions(@Auth() auth: AuthDto, @Query() dto: SearchSuggestionRequestDto): Promise<string[]> {
    return this.service.getSearchSuggestions(auth, dto);
  }
}
