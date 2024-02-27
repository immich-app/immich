import {
  AuthDto,
  MetadataSearchDto,
  PersonResponseDto,
  PlacesResponseDto,
  SearchDto,
  SearchExploreResponseDto,
  SearchPeopleDto,
  SearchPlacesDto,
  SearchResponseDto,
  SearchService,
  SmartSearchDto,
} from '@app/domain';
import { SearchSuggestionRequestDto } from '@app/domain/search/dto/search-suggestion.dto';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth, Authenticated } from '../app.guard';
import { UseValidation } from '../app.utils';

@ApiTags('Search')
@Controller('search')
@Authenticated()
@UseValidation()
export class SearchController {
  constructor(private service: SearchService) {}

  @Post('metadata')
  searchMetadata(@Auth() auth: AuthDto, @Body() dto: MetadataSearchDto): Promise<SearchResponseDto> {
    return this.service.searchMetadata(auth, dto);
  }

  @Post('smart')
  searchSmart(@Auth() auth: AuthDto, @Body() dto: SmartSearchDto): Promise<SearchResponseDto> {
    return this.service.searchSmart(auth, dto);
  }

  @Get()
  @ApiOperation({ deprecated: true })
  search(@Auth() auth: AuthDto, @Query() dto: SearchDto): Promise<SearchResponseDto> {
    return this.service.search(auth, dto);
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

  @Get('suggestions')
  getSearchSuggestions(@Auth() auth: AuthDto, @Query() dto: SearchSuggestionRequestDto): Promise<string[]> {
    return this.service.getSearchSuggestions(auth, dto);
  }
}
