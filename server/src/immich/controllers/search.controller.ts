import {
  AuthDto,
  PersonResponseDto,
  SearchDto,
  SearchExploreResponseDto,
  SearchPeopleDto,
  SearchResponseDto,
  SearchService,
} from '@app/domain';
import { SearchSuggestionRequestDto } from '@app/domain/search/dto/search-suggestion.dto';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth, Authenticated } from '../app.guard';
import { UseValidation } from '../app.utils';

@ApiTags('Search')
@Controller('search')
@Authenticated()
@UseValidation()
export class SearchController {
  constructor(private service: SearchService) {}

  @Get()
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

  @Get('suggestions')
  getSearchSuggestions(@Auth() auth: AuthDto, @Query() dto: SearchSuggestionRequestDto): Promise<string[]> {
    return this.service.getSearchSuggestions(auth, dto);
  }
}
