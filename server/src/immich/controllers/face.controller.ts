import { AssetFaceResponseDto, AuthDto, FaceDto, PersonResponseDto, PersonService, ReassignFaceDto } from '@app/domain';
import { Body, Controller, Delete, Get, Param, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth, Authenticated } from '../app.guard';
import { UseValidation } from '../app.utils';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Face')
@Controller('face')
@Authenticated()
@UseValidation()
export class FaceController {
  constructor(private service: PersonService) {}

  @Get()
  getFaces(@Auth() auth: AuthDto, @Query() dto: FaceDto): Promise<AssetFaceResponseDto[]> {
    return this.service.getFacesById(auth, dto);
  }

  @Put(':id')
  reassignFace(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: ReassignFaceDto,
  ): Promise<PersonResponseDto> {
    return this.service.reassignFace(auth, id, dto);
  }

  @Delete(':id')
  unassignFace(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<AssetFaceResponseDto> {
    return this.service.unassignFace(auth, id);
  }
}
