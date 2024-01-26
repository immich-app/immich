import {
  AuthDto,
  PersonResponseDto,
  SearchDto,
  SearchExploreDto,
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
  getExploreData(@Auth() auth: AuthDto, @Query() dto: SearchExploreDto): Promise<SearchExploreResponseDto[]> {
    return this.service.getExploreData(auth, dto) as Promise<SearchExploreResponseDto[]>;
  }

  @Get('person')
  searchPerson(@Auth() auth: AuthDto, @Query() dto: SearchPeopleDto): Promise<PersonResponseDto[]> {
    return this.service.searchPerson(auth, dto);
  }
}
