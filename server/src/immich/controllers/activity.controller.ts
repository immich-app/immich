import { AuthUserDto } from '@app/domain';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser, Authenticated } from '../app.guard';
import { UseValidation } from '../app.utils';

import {
  ActivityCommentDto,
  ActivityFavoriteDto,
  ActivityReponseDto,
  ActivityService,
  StatisticsResponseDto,
} from '@app/domain/activity';
import { ParseMeUUIDPipe } from '../api-v1/validation/parse-me-uuid-pipe';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Activity')
@Controller('activity')
@Authenticated()
@UseValidation()
export class ActivityController {
  constructor(private service: ActivityService) {}

  @Get('statistics/asset/:id/album/:albumId')
  getStatistics(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Param('albumId', new ParseMeUUIDPipe({ version: '4' })) albumId: string,
  ): Promise<StatisticsResponseDto> {
    return this.service.getStatistics(authUser, id, albumId);
  }

  @Get('asset/:id/album/:albumId')
  getActivity(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Param('albumId', new ParseMeUUIDPipe({ version: '4' })) albumId: string,
  ): Promise<ActivityReponseDto[]> {
    return this.service.getById(authUser, id, albumId);
  }

  @Get('favorite/asset/:id/album/:albumId')
  getFavorite(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Param('albumId', new ParseMeUUIDPipe({ version: '4' })) albumId: string,
  ): Promise<ActivityReponseDto> {
    return this.service.getFavorite(authUser, id, albumId);
  }

  @Post('favorite')
  changeFavorite(
    @AuthUser() authUser: AuthUserDto,
    @Body() dto: ActivityFavoriteDto,
  ): Promise<ActivityReponseDto> {
    return this.service.changeFavorite(authUser, dto);
  }

  @Post('comment')
  addComment(
    @AuthUser() authUser: AuthUserDto,
    @Body() dto: ActivityCommentDto,
  ): Promise<ActivityReponseDto> {
    return this.service.addComment(authUser, dto);
  }

  @Delete('comment/:id')
  deleteComment(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.deleteComment(authUser, id);
  }
}
