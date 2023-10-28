import { AuthUserDto } from '@app/domain';
import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
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

  @Get('statistics/:id/:albumId')
  getStatistics(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Param('albumId', new ParseMeUUIDPipe({ version: '4' })) albumId: string,
  ): Promise<StatisticsResponseDto> {
    return this.service.getStatistics(authUser, id, albumId);
  }

  @Get(':id/:albumId')
  getActivity(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Param('albumId', new ParseMeUUIDPipe({ version: '4' })) albumId: string,
  ): Promise<ActivityReponseDto[]> {
    return this.service.getById(authUser, id, albumId);
  }

  @Get('favorite/:id/:albumId')
  getFavorite(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Param('albumId', new ParseMeUUIDPipe({ version: '4' })) albumId: string,
  ): Promise<ActivityReponseDto> {
    return this.service.getFavorite(authUser, id, albumId);
  }

  @Put('favorite/:id/:albumId')
  changeFavorite(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: ActivityFavoriteDto,
    @Param('albumId', new ParseMeUUIDPipe({ version: '4' })) albumId: string,
  ): Promise<ActivityReponseDto> {
    return this.service.changeFavorite(authUser, id, dto, albumId);
  }

  @Put('comment/:id/:albumId')
  addComment(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: ActivityCommentDto,
    @Param('albumId', new ParseMeUUIDPipe({ version: '4' })) albumId: string,
  ): Promise<ActivityReponseDto> {
    return this.service.addComment(authUser, id, dto, albumId);
  }

  @Delete('comment/:id')
  deleteComment(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.deleteComment(authUser, id);
  }
}
