import {
  AuthUserDto,
  SearchConfigResponseDto,
  SearchDto,
  SearchExploreResponseDto,
  SearchResponseDto,
  SearchService,
} from '@app/domain';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../decorators/auth-user.decorator';
import { Authenticated } from '../decorators/authenticated.decorator';
import { UseValidation } from '../decorators/use-validation.decorator';

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

  @Get('config')
  getSearchConfig(): SearchConfigResponseDto {
    return this.service.getConfig();
  }

  @Get('explore')
  getExploreData(@AuthUser() authUser: AuthUserDto): Promise<SearchExploreResponseDto[]> {
    return this.service.getExploreData(authUser) as Promise<SearchExploreResponseDto[]>;
  }
}
