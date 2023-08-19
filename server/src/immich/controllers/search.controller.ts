import { AuthUserDto, SearchDto, SearchExploreResponseDto, SearchResponseDto, SearchService } from '@app/domain';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated, AuthUser } from '../app.guard';
import { UseValidation } from '../app.utils';

@ApiTags('Search')
@Controller('search')
@Authenticated()
@UseValidation()
export class SearchController {
  constructor(private service: SearchService) {}

  @Get()
  search(@AuthUser() authUser: AuthUserDto, @Query() dto: SearchDto): Promise<SearchResponseDto> {
    return this.service.search(authUser, dto);
  }

  @Get('explore')
  getExploreData(@AuthUser() authUser: AuthUserDto): Promise<SearchExploreResponseDto[]> {
    return this.service.getExploreData(authUser) as Promise<SearchExploreResponseDto[]>;
  }
}
