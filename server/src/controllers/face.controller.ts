import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetFaceResponseDto, CreateFaceDto, DeleteFaceDto, FaceDto, PersonResponseDto } from 'src/dtos/person.dto';
import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { PersonService } from 'src/services/person.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Faces')
@Controller('faces')
export class FaceController {
  constructor(private service: PersonService) {}

  @Get()
  @Authenticated({ permission: Permission.FACE_READ })
  getFaces(@Auth() auth: AuthDto, @Query() dto: FaceDto): Promise<AssetFaceResponseDto[]> {
    return this.service.getFacesById(auth, dto);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.FACE_UPDATE })
  reassignFacesById(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: FaceDto,
  ): Promise<PersonResponseDto> {
    return this.service.reassignFacesById(auth, id, dto);
  }

  @Post()
  @Authenticated({ permission: Permission.FACE_CREATE })
  createFace(@Auth() auth: AuthDto, @Body() dto: CreateFaceDto) {
    return this.service.tagFace(auth, dto);
  }

  @Delete()
  @Authenticated({ permission: Permission.FACE_DELETE })
  deleteFace(@Auth() auth: AuthDto, @Body() dto: DeleteFaceDto) {
    return this.service.deleteFace(auth, dto);
  }
}
