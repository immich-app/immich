import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PersonService } from 'src/domain/person/person.service';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetFaceResponseDto, FaceDto, PersonResponseDto } from 'src/dtos/person.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
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
