import {
  AssetResponseDto,
  AuthUserDto,
  BulkIdResponseDto,
  ImmichReadStream,
  MergePersonDto,
  PersonCountResponseDto,
  PersonResponseDto,
  PersonService,
  PersonUpdateDto,
} from '@app/domain';
import { Body, Controller, Get, Param, Post, Put, Query, StreamableFile } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Authenticated, AuthUser } from '../app.guard';
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
  getAllPeople(
    @AuthUser() authUser: AuthUserDto,
    @Query('areHidden') areHidden: boolean,
  ): Promise<PersonResponseDto[]> {
    return this.service.getAll(authUser, areHidden);
  }

  @Get('/personById/:id')
  getPerson(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<PersonResponseDto> {
    return this.service.getById(authUser, id);
  }

  @Put('/personById/:id')
  updatePerson(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: PersonUpdateDto,
  ): Promise<PersonResponseDto> {
    return this.service.update(authUser, id, dto);
  }

  @Get('/count')
  getPersonCount(@AuthUser() authUser: AuthUserDto): Promise<PersonCountResponseDto> {
    return this.service.getPersonCount(authUser);
  }

  @Get('/personById/:id/thumbnail')
  @ApiOkResponse({
    content: {
      'image/jpeg': { schema: { type: 'string', format: 'binary' } },
    },
  })
  getPersonThumbnail(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto) {
    return this.service.getThumbnail(authUser, id).then(asStreamableFile);
  }

  @Get('/personById/:id/assets')
  getPersonAssets(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<AssetResponseDto[]> {
    return this.service.getAssets(authUser, id);
  }

  @Post('/personById/:id/merge')
  mergePerson(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: MergePersonDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.mergePerson(authUser, id, dto);
  }
}
