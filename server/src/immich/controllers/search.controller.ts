import {
  AuthDto,
  PersonResponseDto,
  SearchDto,
  SearchExploreResponseDto,
  SearchPeopleDto,
  SearchResponseDto,
  SearchService,
} from '@app/domain';
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

  @Get('people-suggestions')
  getPeopleSuggestions(@Auth() auth: AuthDto): Promise<PersonResponseDto[]> {
    return this.service.getPeopleSuggestions(auth);
  }

  @Get('country-suggestions')
  getCountrySuggestions(@Auth() auth: AuthDto): Promise<string[]> {
    return this.service.getCountrySuggestions(auth);
  }

  @Get('state-suggestions')
  getStateSuggestions(@Auth() auth: AuthDto): Promise<string[]> {
    return this.service.getStateSuggestions(auth);
  }

  @Get('city-suggestions')
  getCitySuggestions(@Auth() auth: AuthDto): Promise<string[]> {
    return this.service.getCitySuggestions(auth);
  }

  @Get('camera-make-suggestions')
  getCameraMakeSuggestions(@Auth() auth: AuthDto): Promise<string[]> {
    return this.service.getCameraMakeSuggestions(auth);
  }

  @Get('camera-model-suggestions')
  getCameraModelSuggestions(@Auth() auth: AuthDto): Promise<string[]> {
    return this.service.getCameraModelSuggestions(auth);
  }
}
