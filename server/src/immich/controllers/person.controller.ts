import {
  AssetResponseDto,
  AuthUserDto,
  ImmichReadStream,
  PersonResponseDto,
  PersonService,
  PersonUpdateDto,
} from '@app/domain';
import { Body, Controller, Get, Param, Put, StreamableFile } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GetAuthUser } from '../decorators/auth-user.decorator';

import { Authenticated } from '../decorators/authenticated.decorator';
import { UseValidation } from '../decorators/use-validation.decorator';
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
  getAllPeople(@GetAuthUser() authUser: AuthUserDto): Promise<PersonResponseDto[]> {
    return this.service.getAll(authUser);
  }

  @Get(':id')
  getPerson(@GetAuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<PersonResponseDto> {
    return this.service.getById(authUser, id);
  }

  @Put(':id')
  updatePerson(
    @GetAuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: PersonUpdateDto,
  ): Promise<PersonResponseDto> {
    return this.service.update(authUser, id, dto);
  }

  @Get(':id/thumbnail')
  @ApiOkResponse({ content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } })
  getPersonThumbnail(@GetAuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto) {
    return this.service.getThumbnail(authUser, id).then(asStreamableFile);
  }

  @Get(':id/assets')
  getPersonAssets(@GetAuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<AssetResponseDto[]> {
    return this.service.getAssets(authUser, id);
  }
}
