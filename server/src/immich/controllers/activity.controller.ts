import { AuthUserDto } from '@app/domain';
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser, Authenticated } from '../app.guard';
import { UseValidation } from '../app.utils';

import {
  ActivityCommentDto,
  ActivityDto,
  ActivityFavoriteDto,
  ActivityReponseDto,
  ActivityService,
  LikeStatusReponseDto,
  StatisticsResponseDto,
} from '@app/domain/activity';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Activity')
@Controller('activity')
@Authenticated()
@UseValidation()
export class ActivityController {
  constructor(private service: ActivityService) {}

  @Get('statistics')
  getStatistics(@AuthUser() authUser: AuthUserDto, @Query() dto: ActivityDto): Promise<StatisticsResponseDto> {
    return this.service.getStatistics(authUser, dto);
  }

  @Get('')
  getActivity(@AuthUser() authUser: AuthUserDto, @Query() dto: ActivityDto): Promise<ActivityReponseDto[]> {
    return this.service.getById(authUser, dto);
  }

  @Get('like')
  getFavorite(@AuthUser() authUser: AuthUserDto, @Query() dto: ActivityDto): Promise<LikeStatusReponseDto> {
    return this.service.getFavorite(authUser, dto);
  }

  @Put('like')
  changeFavorite(
    @AuthUser() authUser: AuthUserDto,
    @Body() dto: ActivityFavoriteDto,
  ): Promise<ActivityReponseDto | void> {
    return this.service.changeFavorite(authUser, dto);
  }

  @Post('comment')
  addComment(@AuthUser() authUser: AuthUserDto, @Body() dto: ActivityCommentDto): Promise<ActivityReponseDto> {
    return this.service.addComment(authUser, dto);
  }

  @Delete('comment/:id')
  deleteComment(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.deleteComment(authUser, id);
  }
}
