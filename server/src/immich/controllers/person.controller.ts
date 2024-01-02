import {
  AssetFaceUpdateDto,
  AssetResponseDto,
  AuthDto,
  BulkIdResponseDto,
  MergePersonDto,
  PeopleResponseDto,
  PeopleUpdateDto,
  PersonResponseDto,
  PersonSearchDto,
  PersonService,
  PersonStatisticsResponseDto,
  PersonUpdateDto,
} from '@app/domain';
import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth, Authenticated, FileResponse } from '../app.guard';
import { UseValidation } from '../app.utils';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Person')
@Controller('person')
@Authenticated()
@UseValidation()
export class PersonController {
  constructor(private service: PersonService) {}

  @Get()
  getAllPeople(@Auth() auth: AuthDto, @Query() withHidden: PersonSearchDto): Promise<PeopleResponseDto> {
    return this.service.getAll(auth, withHidden);
  }

  @Post()
  createPerson(@Auth() auth: AuthDto): Promise<PersonResponseDto> {
    return this.service.createPerson(auth);
  }

  @Put(':id/reassign')
  reassignFaces(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AssetFaceUpdateDto,
  ): Promise<PersonResponseDto[]> {
    return this.service.reassignFaces(auth, id, dto);
  }

  @Put()
  updatePeople(@Auth() auth: AuthDto, @Body() dto: PeopleUpdateDto): Promise<BulkIdResponseDto[]> {
    return this.service.updatePeople(auth, dto);
  }

  @Get(':id')
  getPerson(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<PersonResponseDto> {
    return this.service.getById(auth, id);
  }

  @Put(':id')
  updatePerson(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: PersonUpdateDto,
  ): Promise<PersonResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Get(':id/statistics')
  getPersonStatistics(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<PersonStatisticsResponseDto> {
    return this.service.getStatistics(auth, id);
  }

  @Get(':id/thumbnail')
  @FileResponse()
  getPersonThumbnail(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto) {
    return this.service.getThumbnail(auth, id);
  }

  @Get(':id/assets')
  getPersonAssets(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<AssetResponseDto[]> {
    return this.service.getAssets(auth, id);
  }

  @Post(':id/merge')
  mergePerson(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: MergePersonDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.mergePerson(auth, id, dto);
  }
}
