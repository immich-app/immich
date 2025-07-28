import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { PersonResponseDto } from 'src/dtos/person.dto';
import {
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
import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { SearchService } from 'src/services/search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private service: SearchService) {}

  @Post('metadata')
  @HttpCode(HttpStatus.OK)
  @Authenticated({ permission: Permission.AssetRead })
  searchAssets(@Auth() auth: AuthDto, @Body() dto: MetadataSearchDto): Promise<SearchResponseDto> {
    return this.service.searchMetadata(auth, dto);
  }

  @Post('statistics')
  @HttpCode(HttpStatus.OK)
  @Authenticated({ permission: Permission.AssetStatistics })
  searchAssetStatistics(@Auth() auth: AuthDto, @Body() dto: StatisticsSearchDto): Promise<SearchStatisticsResponseDto> {
    return this.service.searchStatistics(auth, dto);
  }

  @Post('random')
  @HttpCode(HttpStatus.OK)
  @Authenticated({ permission: Permission.AssetRead })
  searchRandom(@Auth() auth: AuthDto, @Body() dto: RandomSearchDto): Promise<AssetResponseDto[]> {
    return this.service.searchRandom(auth, dto);
  }

  @Post('smart')
  @HttpCode(HttpStatus.OK)
  @Authenticated({ permission: Permission.AssetRead })
  searchSmart(@Auth() auth: AuthDto, @Body() dto: SmartSearchDto): Promise<SearchResponseDto> {
    return this.service.searchSmart(auth, dto);
  }

  @Get('explore')
  @Authenticated({ permission: Permission.AssetRead })
  getExploreData(@Auth() auth: AuthDto): Promise<SearchExploreResponseDto[]> {
    return this.service.getExploreData(auth);
  }

  @Get('person')
  @Authenticated({ permission: Permission.PersonRead })
  searchPerson(@Auth() auth: AuthDto, @Query() dto: SearchPeopleDto): Promise<PersonResponseDto[]> {
    return this.service.searchPerson(auth, dto);
  }

  @Get('places')
  @Authenticated({ permission: Permission.AssetRead })
  searchPlaces(@Query() dto: SearchPlacesDto): Promise<PlacesResponseDto[]> {
    return this.service.searchPlaces(dto);
  }

  @Get('cities')
  @Authenticated({ permission: Permission.AssetRead })
  getAssetsByCity(@Auth() auth: AuthDto): Promise<AssetResponseDto[]> {
    return this.service.getAssetsByCity(auth);
  }

  @Get('suggestions')
  @Authenticated({ permission: Permission.AssetRead })
  getSearchSuggestions(@Auth() auth: AuthDto, @Query() dto: SearchSuggestionRequestDto): Promise<string[]> {
    // TODO fix open api generation to indicate that results can be nullable
    return this.service.getSearchSuggestions(auth, dto) as Promise<string[]>;
  }
}
