import {
  AssetResponseDto,
  AuthUserDto,
  ImmichReadStream,
  PersonResponseDto as ResponseDto,
  PersonService,
  PersonUpdateDto as UpdateDto,
} from '@app/domain';
import { Controller, Get, Header, Param, Put, StreamableFile } from '@nestjs/common';
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
  getAllPeople(@GetAuthUser() authUser: AuthUserDto): Promise<ResponseDto[]> {
    return this.service.getAll(authUser);
  }

  @Get(':id')
  getPerson(@GetAuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<ResponseDto> {
    return this.service.getById(authUser, id);
  }

  @Put(':id')
  updatePerson(
    @GetAuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    dto: UpdateDto,
  ): Promise<ResponseDto> {
    return this.service.update(authUser, id, dto);
  }

  @Get(':id/thumbnail')
  @Header('Cache-Control', 'max-age=31536000')
  @Header('Content-Type', 'image/jpeg')
  @ApiOkResponse({ content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } })
  getPersonThumbnail(@GetAuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto) {
    return this.service.getThumbnail(authUser, id).then(asStreamableFile);
  }

  @Get(':id/assets')
  getPersonAssets(@GetAuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<AssetResponseDto[]> {
    return this.service.getAssets(authUser, id);
  }
}
