import {
  AssetFaceUpdateDto,
  AssetResponseDto,
  AuthDto,
  BulkIdResponseDto,
  ImmichReadStream,
  MergePersonDto,
  PeopleResponseDto,
  PeopleUpdateDto,
  PersonResponseDto,
  PersonSearchDto,
  PersonService,
  PersonStatisticsResponseDto,
  PersonUpdateDto,
} from '@app/domain';
import { Body, Controller, Get, Param, Post, Put, Query, StreamableFile } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthUser, Authenticated } from '../app.guard';
import { UseValidation } from '../app.utils';
import { UUIDParamDto } from './dto/uuid-param.dto';

function asStreamableFile({ stream, type, length }: ImmichReadStream) {
  return new StreamableFile(stream, { type, length });
}

@ApiTags('Person')
@Controller('person')
@Authenticated()
@UseValidation()
export class PersonController {
  constructor(private service: PersonService) {}

  @Get()
  getAllPeople(@AuthUser() auth: AuthDto, @Query() withHidden: PersonSearchDto): Promise<PeopleResponseDto> {
    return this.service.getAll(auth, withHidden);
  }

  @Post()
  createPerson(@AuthUser() auth: AuthDto): Promise<PersonResponseDto> {
    return this.service.createPerson(auth);
  }

  @Put(':id/reassign')
  reassignFaces(
    @AuthUser() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AssetFaceUpdateDto,
  ): Promise<PersonResponseDto[]> {
    return this.service.reassignFaces(auth, id, dto);
  }

  @Put()
  updatePeople(@AuthUser() auth: AuthDto, @Body() dto: PeopleUpdateDto): Promise<BulkIdResponseDto[]> {
    return this.service.updatePeople(auth, dto);
  }

  @Get(':id')
  getPerson(@AuthUser() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<PersonResponseDto> {
    return this.service.getById(auth, id);
  }

  @Put(':id')
  updatePerson(
    @AuthUser() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: PersonUpdateDto,
  ): Promise<PersonResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Get(':id/statistics')
  getPersonStatistics(@AuthUser() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<PersonStatisticsResponseDto> {
    return this.service.getStatistics(auth, id);
  }

  @Get(':id/thumbnail')
  @ApiOkResponse({
    content: {
      'image/jpeg': { schema: { type: 'string', format: 'binary' } },
    },
  })
  getPersonThumbnail(@AuthUser() auth: AuthDto, @Param() { id }: UUIDParamDto) {
    return this.service.getThumbnail(auth, id).then(asStreamableFile);
  }

  @Get(':id/assets')
  getPersonAssets(@AuthUser() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<AssetResponseDto[]> {
    return this.service.getAssets(auth, id);
  }

  @Post(':id/merge')
  mergePerson(
    @AuthUser() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: MergePersonDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.mergePerson(auth, id, dto);
  }
}
