import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { PersonResponseDto } from 'src/dtos/person.dto';
import {
  MetadataSearchDto,
  PlacesResponseDto,
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
export class SearchController {
  constructor(private service: SearchService) {}

  @Post('metadata')
  @HttpCode(HttpStatus.OK)
  @Authenticated()
  searchMetadata(@Auth() auth: AuthDto, @Body() dto: MetadataSearchDto): Promise<SearchResponseDto> {
    return this.service.searchMetadata(auth, dto);
  }

  @Post('smart')
  @HttpCode(HttpStatus.OK)
  @Authenticated()
  searchSmart(@Auth() auth: AuthDto, @Body() dto: SmartSearchDto): Promise<SearchResponseDto> {
    return this.service.searchSmart(auth, dto);
  }

  @Get('explore')
  @Authenticated()
  getExploreData(@Auth() auth: AuthDto): Promise<SearchExploreResponseDto[]> {
    return this.service.getExploreData(auth) as Promise<SearchExploreResponseDto[]>;
  }

  @Get('person')
  @Authenticated()
  searchPerson(@Auth() auth: AuthDto, @Query() dto: SearchPeopleDto): Promise<PersonResponseDto[]> {
    return this.service.searchPerson(auth, dto);
  }

  @Get('places')
  @Authenticated()
  searchPlaces(@Query() dto: SearchPlacesDto): Promise<PlacesResponseDto[]> {
    return this.service.searchPlaces(dto);
  }

  @Get('cities')
  @Authenticated()
  getAssetsByCity(@Auth() auth: AuthDto): Promise<AssetResponseDto[]> {
    return this.service.getAssetsByCity(auth);
  }

  @Get('suggestions')
  @Authenticated()
  getSearchSuggestions(@Auth() auth: AuthDto, @Query() dto: SearchSuggestionRequestDto): Promise<string[]> {
    return this.service.getSearchSuggestions(auth, dto);
  }
}
