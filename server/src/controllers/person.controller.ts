import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Next,
  Param,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NextFunction, Response } from 'express';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  AssetFaceUpdateDto,
  DetachScopedPersonDto,
  MergePersonDto,
  MergeScopedPeopleDto,
  PeopleFaceStatisticsResponseDto,
  PeopleResponseDto,
  PeopleStatisticsResponseDto,
  PeopleUpdateDto,
  PersonCreateDto,
  PersonFacePageQueryDto,
  PersonFacePageResponseDto,
  PersonResponseDto,
  PersonSearchDto,
  PersonStatisticsResponseDto,
  PersonUpdateDto,
  RepresentativeFaceUpdateDto,
} from 'src/dtos/person.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated, FileResponse } from 'src/middleware/auth.guard';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PersonService } from 'src/services/person.service';
import { sendFile } from 'src/utils/file';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.People)
@Controller('people')
export class PersonController {
  constructor(
    private service: PersonService,
    private logger: LoggingRepository,
  ) {
    this.logger.setContext(PersonController.name);
  }

  @Get()
  @Authenticated({ permission: Permission.PersonRead })
  @Endpoint({
    summary: 'Get all people',
    description: 'Retrieve a list of all people.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getAllPeople(@Auth() auth: AuthDto, @Query() options: PersonSearchDto): Promise<PeopleResponseDto> {
    return this.service.getAll(auth, options);
  }

  @Post()
  @Authenticated({ permission: Permission.PersonCreate })
  @Endpoint({
    summary: 'Create a person',
    description: 'Create a new person that can have multiple faces assigned to them.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  createPerson(@Auth() auth: AuthDto, @Body() dto: PersonCreateDto): Promise<PersonResponseDto> {
    return this.service.create(auth, dto);
  }

  @Put()
  @Authenticated({ permission: Permission.PersonUpdate })
  @Endpoint({
    summary: 'Update people',
    description: 'Bulk update multiple people at once.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  updatePeople(@Auth() auth: AuthDto, @Body() dto: PeopleUpdateDto): Promise<BulkIdResponseDto[]> {
    return this.service.updateAll(auth, dto);
  }

  @Delete()
  @Authenticated({ permission: Permission.PersonDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete people',
    description: 'Bulk delete a list of people at once.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  deletePeople(@Auth() auth: AuthDto, @Body() dto: BulkIdsDto): Promise<void> {
    return this.service.deleteAll(auth, dto);
  }

  @Post('same-person')
  @Authenticated({ permission: Permission.PersonMerge })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Merge scoped people by identity',
    description: 'Mark personal and space people as the same person without exposing raw face identity IDs.',
    history: new HistoryBuilder().added('v2').stable('v2'),
  })
  mergeScopedPeople(@Auth() auth: AuthDto, @Body() dto: MergeScopedPeopleDto): Promise<void> {
    return this.service.mergeScopedPeople(auth, dto);
  }

  @Post('detach-profile')
  @Authenticated({ permission: Permission.PersonMerge })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Detach a scoped person profile',
    description: 'Separate one personal or space person profile from a grouped person identity.',
    history: new HistoryBuilder().added('v2').stable('v2'),
  })
  detachScopedPerson(@Auth() auth: AuthDto, @Body() dto: DetachScopedPersonDto): Promise<void> {
    return this.service.detachScopedPerson(auth, dto);
  }

  @Get('statistics')
  @Authenticated({ permission: Permission.PersonRead })
  @Endpoint({
    summary: 'Get people statistics',
    description: 'Retrieve people and detected-face counts for the authenticated user people scope.',
    history: new HistoryBuilder().added('v2').stable('v2'),
  })
  getPeopleStatistics(@Auth() auth: AuthDto, @Query() options: PersonSearchDto): Promise<PeopleStatisticsResponseDto> {
    return this.service.getPeopleStatistics(auth, options);
  }

  @Get('face-statistics')
  @Authenticated({ permission: Permission.PersonRead })
  @Endpoint({
    summary: 'Get people face statistics',
    description: 'Retrieve detailed detected-face counts for the authenticated user people scope.',
    history: new HistoryBuilder().added('v2').stable('v2'),
  })
  getPeopleFaceStatistics(
    @Auth() auth: AuthDto,
    @Query() options: PersonSearchDto,
  ): Promise<PeopleFaceStatisticsResponseDto> {
    return this.service.getPeopleFaceStatistics(auth, options);
  }

  @Get(':id/faces')
  @Authenticated({ permission: Permission.PersonRead })
  @Endpoint({
    summary: 'Get person faces',
    description: 'Retrieve detected face crops for a person.',
    history: new HistoryBuilder().added('v2').stable('v2'),
  })
  getPersonFaces(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Query() dto: PersonFacePageQueryDto,
  ): Promise<PersonFacePageResponseDto> {
    return this.service.getFacesForPicker(auth, id, dto);
  }

  @Get(':id/faces/:faceId/thumbnail')
  @FileResponse()
  @Authenticated({ permission: Permission.PersonRead })
  @Endpoint({
    summary: 'Get person face thumbnail',
    description: 'Retrieve an exact face-crop thumbnail for a person.',
    history: new HistoryBuilder().added('v2').stable('v2'),
  })
  async getPersonFaceThumbnail(
    @Res() res: Response,
    @Next() next: NextFunction,
    @Auth() auth: AuthDto,
    @Param('id') id: string,
    @Param('faceId') faceId: string,
  ) {
    await sendFile(res, next, () => this.service.getFaceThumbnail(auth, id, faceId), this.logger);
  }

  @Put(':id/representative-face')
  @Authenticated({ permission: Permission.PersonUpdate })
  @Endpoint({
    summary: 'Update representative face',
    description: 'Update the exact face crop used as the person thumbnail.',
    history: new HistoryBuilder().added('v2').stable('v2'),
  })
  updateRepresentativeFace(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: RepresentativeFaceUpdateDto,
  ): Promise<PersonResponseDto> {
    return this.service.updateRepresentativeFace(auth, id, dto);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.PersonRead })
  @Endpoint({
    summary: 'Get a person',
    description: 'Retrieve a person by id.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getPerson(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<PersonResponseDto> {
    return this.service.getById(auth, id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.PersonUpdate })
  @Endpoint({
    summary: 'Update person',
    description: 'Update an individual person.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  updatePerson(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: PersonUpdateDto,
  ): Promise<PersonResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.PersonDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete person',
    description: 'Delete an individual person.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  deletePerson(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }

  @Get(':id/statistics')
  @Authenticated({ permission: Permission.PersonStatistics })
  @Endpoint({
    summary: 'Get person statistics',
    description: 'Retrieve statistics about a specific person.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getPersonStatistics(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<PersonStatisticsResponseDto> {
    return this.service.getStatistics(auth, id);
  }

  @Get(':id/thumbnail')
  @FileResponse()
  @Authenticated({ permission: Permission.PersonRead })
  @Endpoint({
    summary: 'Get person thumbnail',
    description: 'Retrieve the thumbnail file for a person.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  async getPersonThumbnail(
    @Res() res: Response,
    @Next() next: NextFunction,
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
  ) {
    await sendFile(res, next, () => this.service.getThumbnail(auth, id), this.logger);
  }

  @Put(':id/reassign')
  @Authenticated({ permission: Permission.PersonReassign })
  @Endpoint({
    summary: 'Reassign faces',
    description: 'Bulk reassign a list of faces to a different person.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  reassignFaces(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AssetFaceUpdateDto,
  ): Promise<PersonResponseDto[]> {
    return this.service.reassignFaces(auth, id, dto);
  }

  @Post(':id/merge')
  @Authenticated({ permission: Permission.PersonMerge })
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Merge people',
    description: 'Merge a list of people into the person specified in the path parameter.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  mergePerson(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: MergePersonDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.mergePerson(auth, id, dto);
  }
}
