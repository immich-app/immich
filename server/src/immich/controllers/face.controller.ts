import { AssetFaceResponseDto, AuthUserDto, FaceDto, PersonResponseDto, PersonService } from '@app/domain';
import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser, Authenticated } from '../app.guard';
import { UseValidation } from '../app.utils';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Face')
@Controller('face')
@Authenticated()
@UseValidation()
export class FaceController {
  constructor(private service: PersonService) {}

  @Get()
  getFaces(@AuthUser() authUser: AuthUserDto, @Query() dto: FaceDto): Promise<AssetFaceResponseDto[]> {
    return this.service.getFacesById(authUser, dto);
  }

  @Put(':id')
  reassignFacesById(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: FaceDto,
  ): Promise<PersonResponseDto> {
    return this.service.reassignFacesById(authUser, id, dto);
  }
}
