import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({
    summary: 'Search assets by metadata',
    description: 'Search for assets based on various metadata criteria.',
  })
  searchAssets(@Auth() auth: AuthDto, @Body() dto: MetadataSearchDto): Promise<SearchResponseDto> {
    return this.service.searchMetadata(auth, dto);
  }

  @Post('statistics')
  @Authenticated({ permission: Permission.AssetStatistics })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search asset statistics',
    description: 'Retrieve statistical data about assets based on search criteria, such as the total matching count.',
  })
  searchAssetStatistics(@Auth() auth: AuthDto, @Body() dto: StatisticsSearchDto): Promise<SearchStatisticsResponseDto> {
    return this.service.searchStatistics(auth, dto);
  }

  @Post('random')
  @Authenticated({ permission: Permission.AssetRead })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search random assets',
    description: 'Retrieve a random selection of assets based on the provided criteria.',
  })
  searchRandom(@Auth() auth: AuthDto, @Body() dto: RandomSearchDto): Promise<AssetResponseDto[]> {
    return this.service.searchRandom(auth, dto);
  }

  @Post('large-assets')
  @Authenticated({ permission: Permission.AssetRead })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search large assets',
    description: 'Search for assets that are considered large based on specified criteria.',
  })
  searchLargeAssets(@Auth() auth: AuthDto, @Query() dto: LargeAssetSearchDto): Promise<AssetResponseDto[]> {
    return this.service.searchLargeAssets(auth, dto);
  }

  @Post('smart')
  @Authenticated({ permission: Permission.AssetRead })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Smart asset search',
    description: 'Perform a smart search for assets by using machine learning vectors to determine relevance.',
  })
  searchSmart(@Auth() auth: AuthDto, @Body() dto: SmartSearchDto): Promise<SearchResponseDto> {
    return this.service.searchSmart(auth, dto);
  }

  @Get('explore')
  @Authenticated({ permission: Permission.AssetRead })
  @ApiOperation({
    summary: 'Retrieve explore data',
    description: 'Retrieve data for the explore section, such as popular people and places.',
  })
  getExploreData(@Auth() auth: AuthDto): Promise<SearchExploreResponseDto[]> {
    return this.service.getExploreData(auth);
  }

  @Get('person')
  @Authenticated({ permission: Permission.PersonRead })
  @ApiOperation({
    summary: 'Search people',
    description: 'Search for people by name.',
  })
  searchPerson(@Auth() auth: AuthDto, @Query() dto: SearchPeopleDto): Promise<PersonResponseDto[]> {
    return this.service.searchPerson(auth, dto);
  }

  @Get('places')
  @Authenticated({ permission: Permission.AssetRead })
  @ApiOperation({
    summary: 'Search places',
    description: 'Search for places by name.',
  })
  searchPlaces(@Query() dto: SearchPlacesDto): Promise<PlacesResponseDto[]> {
    return this.service.searchPlaces(dto);
  }

  @Get('cities')
  @Authenticated({ permission: Permission.AssetRead })
  @ApiOperation({
    summary: 'Retrieve assets by city',
    description:
      'Retrieve a list of assets with each asset belonging to a different city. This endpoint is used on the places pages to show a single thumbnail for each city the user has assets in.',
  })
  getAssetsByCity(@Auth() auth: AuthDto): Promise<AssetResponseDto[]> {
    return this.service.getAssetsByCity(auth);
  }

  @Get('suggestions')
  @Authenticated({ permission: Permission.AssetRead })
  @ApiOperation({
    summary: 'Retrieve search suggestions',
    description:
      'Retrieve search suggestions based on partial input. This endpoint is used for typeahead search features.',
  })
  getSearchSuggestions(@Auth() auth: AuthDto, @Query() dto: SearchSuggestionRequestDto): Promise<string[]> {
    // TODO fix open api generation to indicate that results can be nullable
    return this.service.getSearchSuggestions(auth, dto) as Promise<string[]>;
  }
}
