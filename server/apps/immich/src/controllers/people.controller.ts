import {
  AssetResponseDto,
  AuthUserDto,
  FacialRecognitionService,
  ImmichReadStream,
  mapPerson,
  PersonResponseDto,
} from '@app/domain';
import { Controller, Get, Header, Param, StreamableFile } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GetAuthUser } from '../decorators/auth-user.decorator';

import { Authenticated } from '../decorators/authenticated.decorator';
import { UseValidation } from '../decorators/use-validation.decorator';
import { UUIDParamDto } from './dto/uuid-param.dto';

function asStreamableFile({ stream, type, length }: ImmichReadStream) {
  return new StreamableFile(stream, { type, length });
}

@ApiTags('People')
@Controller('people')
@Authenticated()
@UseValidation()
export class PeopleController {
  constructor(private service: FacialRecognitionService) {}
  @Get()
  async getAllPeople(@GetAuthUser() authUser: AuthUserDto): Promise<PersonResponseDto[]> {
    return this.service.getAllPeople(authUser.id);
  }

  @Get('/:id')
  async getPerson(@Param() { id }: UUIDParamDto): Promise<PersonResponseDto> {
    return this.service.getPersonById(id);
  }

  @Get('/:id/thumbnail')
  @Header('Cache-Control', 'max-age=31536000')
  @Header('Content-Type', 'image/jpeg')
  @ApiOkResponse({ content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } })
  async getPersonThumbnail(@Param() { id }: UUIDParamDto) {
    return this.service.getPersonThumbnail(id).then(asStreamableFile);
  }

  @Get('/:id/assets')
  async getPersonAssets(@Param() { id }: UUIDParamDto): Promise<AssetResponseDto[]> {
    return this.service.getPersonAssets(id);
  }
}
