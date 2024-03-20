import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/domain/auth/auth.dto';
import { AssetFaceResponseDto, FaceDto, PersonResponseDto } from 'src/domain/person/person.dto';
import { PersonService } from 'src/domain/person/person.service';
import { Auth, Authenticated } from 'src/immich/app.guard';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Face')
@Controller('face')
@Authenticated()
export class FaceController {
  constructor(private service: PersonService) {}

  @Get()
  getFaces(@Auth() auth: AuthDto, @Query() dto: FaceDto): Promise<AssetFaceResponseDto[]> {
    return this.service.getFacesById(auth, dto);
  }

  @Put(':id')
  reassignFacesById(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: FaceDto,
  ): Promise<PersonResponseDto> {
    return this.service.reassignFacesById(auth, id, dto);
  }
}
