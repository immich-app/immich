import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { PersonResponseDto } from 'src/dtos/person.dto';
import {
  MetadataSearchDto,
  PlacesResponseDto,
  SearchDto,
  SearchExploreResponseDto,
  SearchPeopleDto,
  SearchPlacesDto,
  SearchResponseDto,
  SearchSuggestionRequestDto,
  SmartSearchDto,
} from 'src/dtos/search.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { SearchService } from 'src/services/search.service';

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
