import {
  AuthUserDto,
  SearchConfigResponseDto,
  SearchDto,
  SearchExploreResponseDto,
  SearchResponseDto,
  SearchService,
} from '@app/domain';
import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetAuthUser } from '../decorators/auth-user.decorator';
import { Authenticated } from '../decorators/authenticated.decorator';

@ApiTags('Search')
@Authenticated()
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @GetAuthUser() authUser: AuthUserDto,
    @Query(new ValidationPipe({ transform: true })) dto: SearchDto,
  ): Promise<SearchResponseDto> {
    return this.searchService.search(authUser, dto);
  }

  @Get('config')
  getSearchConfig(): SearchConfigResponseDto {
    return this.searchService.getConfig();
  }

  @Get('explore')
  getExploreData(@GetAuthUser() authUser: AuthUserDto): Promise<SearchExploreResponseDto[]> {
    return this.searchService.getExploreData(authUser) as Promise<SearchExploreResponseDto[]>;
  }
}
