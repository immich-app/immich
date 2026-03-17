import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Next,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NextFunction, Response } from 'express';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { MapMarkerResponseDto } from 'src/dtos/map.dto';
import {
  SharedSpacePersonAliasDto,
  SharedSpacePersonMergeDto,
  SharedSpacePersonResponseDto,
  SharedSpacePersonUpdateDto,
} from 'src/dtos/shared-space-person.dto';
import {
  SharedSpaceActivityQueryDto,
  SharedSpaceActivityResponseDto,
  SharedSpaceAssetAddDto,
  SharedSpaceAssetRemoveDto,
  SharedSpaceCreateDto,
  SharedSpaceMemberCreateDto,
  SharedSpaceMemberResponseDto,
  SharedSpaceMemberTimelineDto,
  SharedSpaceMemberUpdateDto,
  SharedSpaceResponseDto,
  SharedSpaceUpdateDto,
} from 'src/dtos/shared-space.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated, FileResponse } from 'src/middleware/auth.guard';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { SharedSpaceService } from 'src/services/shared-space.service';
import { sendFile } from 'src/utils/file';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.SharedSpaces)
@Controller('shared-spaces')
export class SharedSpaceController {
  constructor(
    private service: SharedSpaceService,
    private logger: LoggingRepository,
  ) {
    this.logger.setContext(SharedSpaceController.name);
  }

  @Post()
  @Authenticated({ permission: Permission.SharedSpaceCreate })
  @Endpoint({
    summary: 'Create a shared space',
    description: 'Create a new shared space for collaborative asset management.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  createSpace(@Auth() auth: AuthDto, @Body() dto: SharedSpaceCreateDto): Promise<SharedSpaceResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get()
  @Authenticated({ permission: Permission.SharedSpaceRead })
  @Endpoint({
    summary: 'Get all shared spaces',
    description: 'Retrieve all shared spaces the user is a member of.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  getAllSpaces(@Auth() auth: AuthDto): Promise<SharedSpaceResponseDto[]> {
    return this.service.getAll(auth);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.SharedSpaceRead })
  @Endpoint({
    summary: 'Get a shared space',
    description: 'Retrieve details of a specific shared space.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  getSpace(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<SharedSpaceResponseDto> {
    return this.service.get(auth, id);
  }

  @Patch(':id')
  @Authenticated({ permission: Permission.SharedSpaceUpdate })
  @Endpoint({
    summary: 'Update a shared space',
    description: 'Update the name or description of a shared space.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  updateSpace(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: SharedSpaceUpdateDto,
  ): Promise<SharedSpaceResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.SharedSpaceDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete a shared space',
    description: 'Permanently delete a shared space.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  removeSpace(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }

  @Get(':id/members')
  @Authenticated({ permission: Permission.SharedSpaceRead })
  @Endpoint({
    summary: 'Get members of a shared space',
    description: 'Retrieve all members of a shared space.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  getMembers(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<SharedSpaceMemberResponseDto[]> {
    return this.service.getMembers(auth, id);
  }

  @Post(':id/members')
  @Authenticated({ permission: Permission.SharedSpaceMemberCreate })
  @Endpoint({
    summary: 'Add a member to a shared space',
    description: 'Add a new member to a shared space with an optional role.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  addMember(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: SharedSpaceMemberCreateDto,
  ): Promise<SharedSpaceMemberResponseDto> {
    return this.service.addMember(auth, id, dto);
  }

  @Patch(':id/members/me/timeline')
  @Authenticated({ permission: Permission.SharedSpaceRead })
  @Endpoint({
    summary: 'Update timeline visibility for current member',
    description: "Toggle whether this space's assets appear in the current user's personal timeline.",
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  updateMemberTimeline(
    @Auth() auth: AuthDto,
    @Param('id') id: string,
    @Body() dto: SharedSpaceMemberTimelineDto,
  ): Promise<SharedSpaceMemberResponseDto> {
    return this.service.updateMemberTimeline(auth, id, dto);
  }

  @Patch(':id/view')
  @Authenticated({ permission: Permission.SharedSpaceRead })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Mark space as viewed',
    description: 'Update the last viewed timestamp for the current user in this space.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  markSpaceViewed(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.markSpaceViewed(auth, id);
  }

  @Patch(':id/members/:userId')
  @Authenticated({ permission: Permission.SharedSpaceMemberUpdate })
  @Endpoint({
    summary: 'Update a member in a shared space',
    description: "Update a member's role in a shared space.",
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  updateMember(
    @Auth() auth: AuthDto,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: SharedSpaceMemberUpdateDto,
  ): Promise<SharedSpaceMemberResponseDto> {
    return this.service.updateMember(auth, id, userId, dto);
  }

  @Delete(':id/members/:userId')
  @Authenticated({ permission: Permission.SharedSpaceMemberDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Remove a member from a shared space',
    description: 'Remove a member from a shared space, or leave the space.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  removeMember(@Auth() auth: AuthDto, @Param('id') id: string, @Param('userId') userId: string): Promise<void> {
    return this.service.removeMember(auth, id, userId);
  }

  @Get(':id/map-markers')
  @Authenticated({ permission: Permission.SharedSpaceRead })
  @Endpoint({
    summary: 'Get map markers for a shared space',
    description: 'Retrieve map markers for geotagged assets in a shared space.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  getSpaceMapMarkers(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<MapMarkerResponseDto[]> {
    return this.service.getMapMarkers(auth, id);
  }

  @Post(':id/assets')
  @Authenticated({ permission: Permission.SharedSpaceAssetCreate })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Add assets to a shared space',
    description: 'Add one or more assets to a shared space.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  addAssets(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto, @Body() dto: SharedSpaceAssetAddDto): Promise<void> {
    return this.service.addAssets(auth, id, dto);
  }

  @Delete(':id/assets')
  @Authenticated({ permission: Permission.SharedSpaceAssetDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Remove assets from a shared space',
    description: 'Remove one or more assets from a shared space.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  removeAssets(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: SharedSpaceAssetRemoveDto,
  ): Promise<void> {
    return this.service.removeAssets(auth, id, dto);
  }

  @Get(':id/activities')
  @Authenticated({ permission: Permission.SharedSpaceRead })
  @Endpoint({ operationId: 'getSpaceActivities', summary: 'Get space activity feed' })
  getSpaceActivities(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Query() query: SharedSpaceActivityQueryDto,
  ): Promise<SharedSpaceActivityResponseDto[]> {
    return this.service.getActivities(auth, id, query);
  }

  @Get(':id/people')
  @Authenticated({ permission: Permission.SharedSpaceRead })
  @Endpoint({
    summary: 'Get people in a shared space',
    description: 'Retrieve all people detected in a shared space.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  getSpacePeople(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<SharedSpacePersonResponseDto[]> {
    return this.service.getSpacePeople(auth, id);
  }

  @Get(':id/people/:personId')
  @Authenticated({ permission: Permission.SharedSpaceRead })
  @Endpoint({
    summary: 'Get a person in a shared space',
    description: 'Retrieve details of a specific person in a shared space.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  getSpacePerson(
    @Auth() auth: AuthDto,
    @Param('id') id: string,
    @Param('personId') personId: string,
  ): Promise<SharedSpacePersonResponseDto> {
    return this.service.getSpacePerson(auth, id, personId);
  }

  @Get(':id/people/:personId/thumbnail')
  @FileResponse()
  @Authenticated({ permission: Permission.SharedSpaceRead })
  @Endpoint({
    summary: 'Get a space person thumbnail',
    description: 'Retrieve the thumbnail image for a person in a shared space.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  async getSpacePersonThumbnail(
    @Res() res: Response,
    @Next() next: NextFunction,
    @Auth() auth: AuthDto,
    @Param('id') id: string,
    @Param('personId') personId: string,
  ) {
    await sendFile(res, next, () => this.service.getSpacePersonThumbnail(auth, id, personId), this.logger);
  }

  @Put(':id/people/:personId')
  @Authenticated({ permission: Permission.SharedSpaceUpdate })
  @Endpoint({
    summary: 'Update a person in a shared space',
    description: 'Update the name, visibility, birth date, or representative face of a person.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  updateSpacePerson(
    @Auth() auth: AuthDto,
    @Param('id') id: string,
    @Param('personId') personId: string,
    @Body() dto: SharedSpacePersonUpdateDto,
  ): Promise<SharedSpacePersonResponseDto> {
    return this.service.updateSpacePerson(auth, id, personId, dto);
  }

  @Delete(':id/people/:personId')
  @Authenticated({ permission: Permission.SharedSpaceUpdate })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete a person from a shared space',
    description: 'Permanently delete a person and their face assignments from a shared space.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  deleteSpacePerson(
    @Auth() auth: AuthDto,
    @Param('id') id: string,
    @Param('personId') personId: string,
  ): Promise<void> {
    return this.service.deleteSpacePerson(auth, id, personId);
  }

  @Post(':id/people/:personId/merge')
  @Authenticated({ permission: Permission.SharedSpaceUpdate })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Merge people in a shared space',
    description: 'Merge one or more people into the target person in a shared space.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  mergeSpacePeople(
    @Auth() auth: AuthDto,
    @Param('id') id: string,
    @Param('personId') personId: string,
    @Body() dto: SharedSpacePersonMergeDto,
  ): Promise<void> {
    return this.service.mergeSpacePeople(auth, id, personId, dto);
  }

  @Put(':id/people/:personId/alias')
  @Authenticated({ permission: Permission.SharedSpaceRead })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Set a person alias in a shared space',
    description: 'Set a user-specific alias for a person in a shared space.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  setSpacePersonAlias(
    @Auth() auth: AuthDto,
    @Param('id') id: string,
    @Param('personId') personId: string,
    @Body() dto: SharedSpacePersonAliasDto,
  ): Promise<void> {
    return this.service.setSpacePersonAlias(auth, id, personId, dto);
  }

  @Delete(':id/people/:personId/alias')
  @Authenticated({ permission: Permission.SharedSpaceRead })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete a person alias in a shared space',
    description: 'Remove a user-specific alias for a person in a shared space.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  deleteSpacePersonAlias(
    @Auth() auth: AuthDto,
    @Param('id') id: string,
    @Param('personId') personId: string,
  ): Promise<void> {
    return this.service.deleteSpacePersonAlias(auth, id, personId);
  }

  @Get(':id/people/:personId/assets')
  @Authenticated({ permission: Permission.SharedSpaceRead })
  @Endpoint({
    summary: 'Get assets for a person in a shared space',
    description: 'Retrieve asset IDs for all assets containing a specific person in a shared space.',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  getSpacePersonAssets(
    @Auth() auth: AuthDto,
    @Param('id') id: string,
    @Param('personId') personId: string,
  ): Promise<string[]> {
    return this.service.getSpacePersonAssets(auth, id, personId);
  }
}
