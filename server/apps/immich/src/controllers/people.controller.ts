import { AssetResponseDto, AuthUserDto, ImmichReadStream, PeopleService, PersonResponseDto } from '@app/domain';
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
  constructor(private service: PeopleService) {}
  @Get()
  getAllPeople(@GetAuthUser() authUser: AuthUserDto): Promise<PersonResponseDto[]> {
    return this.service.getAllPeople(authUser.id);
  }

  @Get(':id')
  getPerson(@GetAuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<PersonResponseDto> {
    return this.service.getPersonById(authUser.id, id);
  }

  @Get(':id/thumbnail')
  @Header('Cache-Control', 'max-age=31536000')
  @Header('Content-Type', 'image/jpeg')
  @ApiOkResponse({ content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } })
  getFaceThumbnail(@GetAuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto) {
    return this.service.getFaceThumbnail(authUser.id, id).then(asStreamableFile);
  }

  @Get(':id/assets')
  getPersonAssets(@Param() { id }: UUIDParamDto): Promise<AssetResponseDto[]> {
    return this.service.getPersonAssets(id);
  }
}
