import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { PersonResponseDto } from 'src/dtos/person.dto';
import {
  LargeAssetSearchDto,
  MetadataSearchDto,
  PlacesResponseDto,
  RandomSearchDto,
  SearchExploreResponseDto,
  SearchPeopleDto,
  SearchPlacesDto,
  SearchResponseDto,
  SearchStatisticsResponseDto,
  SearchSuggestionRequestDto,
  SmartSearchDto,
  StatisticsSearchDto,
} from 'src/dtos/search.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { SearchService } from 'src/services/search.service';

@ApiTags(ApiTag.Search)
@Controller('search')
export class SearchController {
  constructor(private service: SearchService) {}

  @Post('metadata')
  @Authenticated({ permission: Permission.AssetRead })
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Search assets by metadata',
    description: 'Search for assets based on various metadata criteria.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  searchAssets(@Auth() auth: AuthDto, @Body() dto: MetadataSearchDto): Promise<SearchResponseDto> {
    return this.service.searchMetadata(auth, dto);
  }

  @Post('statistics')
  @Authenticated({ permission: Permission.AssetStatistics })
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Search asset statistics',
    description: 'Retrieve statistical data about assets based on search criteria, such as the total matching count.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  searchAssetStatistics(@Auth() auth: AuthDto, @Body() dto: StatisticsSearchDto): Promise<SearchStatisticsResponseDto> {
    return this.service.searchStatistics(auth, dto);
  }

  @Post('random')
  @Authenticated({ permission: Permission.AssetRead })
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Search random assets',
    description: 'Retrieve a random selection of assets based on the provided criteria.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  searchRandom(@Auth() auth: AuthDto, @Body() dto: RandomSearchDto): Promise<AssetResponseDto[]> {
    return this.service.searchRandom(auth, dto);
  }

  @Post('large-assets')
  @Authenticated({ permission: Permission.AssetRead })
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Search large assets',
    description: 'Search for assets that are considered large based on specified criteria.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  searchLargeAssets(@Auth() auth: AuthDto, @Query() dto: LargeAssetSearchDto): Promise<AssetResponseDto[]> {
    return this.service.searchLargeAssets(auth, dto);
  }

  @Post('smart')
  @Authenticated({ permission: Permission.AssetRead })
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Smart asset search',
    description: 'Perform a smart search for assets by using machine learning vectors to determine relevance.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  searchSmart(@Auth() auth: AuthDto, @Body() dto: SmartSearchDto): Promise<SearchResponseDto> {
    return this.service.searchSmart(auth, dto);
  }

  @Get('explore')
  @Authenticated({ permission: Permission.AssetRead })
  @Endpoint({
    summary: 'Retrieve explore data',
    description: 'Retrieve data for the explore section, such as popular people and places.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getExploreData(@Auth() auth: AuthDto): Promise<SearchExploreResponseDto[]> {
    return this.service.getExploreData(auth);
  }

  @Get('person')
  @Authenticated({ permission: Permission.PersonRead })
  @Endpoint({
    summary: 'Search people',
    description: 'Search for people by name.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  searchPerson(@Auth() auth: AuthDto, @Query() dto: SearchPeopleDto): Promise<PersonResponseDto[]> {
    return this.service.searchPerson(auth, dto);
  }

  @Get('places')
  @Authenticated({ permission: Permission.AssetRead })
  @Endpoint({
    summary: 'Search places',
    description: 'Search for places by name.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  searchPlaces(@Query() dto: SearchPlacesDto): Promise<PlacesResponseDto[]> {
    return this.service.searchPlaces(dto);
  }

  @Get('cities')
  @Authenticated({ permission: Permission.AssetRead })
  @Endpoint({
    summary: 'Retrieve assets by city',
    description:
      'Retrieve a list of assets with each asset belonging to a different city. This endpoint is used on the places pages to show a single thumbnail for each city the user has assets in.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getAssetsByCity(@Auth() auth: AuthDto): Promise<AssetResponseDto[]> {
    return this.service.getAssetsByCity(auth);
  }

  @Get('suggestions')
  @Authenticated({ permission: Permission.AssetRead })
  @Endpoint({
    summary: 'Retrieve search suggestions',
    description:
      'Retrieve search suggestions based on partial input. This endpoint is used for typeahead search features.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getSearchSuggestions(@Auth() auth: AuthDto, @Query() dto: SearchSuggestionRequestDto): Promise<string[]> {
    // TODO fix open api generation to indicate that results can be nullable
    return this.service.getSearchSuggestions(auth, dto) as Promise<string[]>;
  }
}
