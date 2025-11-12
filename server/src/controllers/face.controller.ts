import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  AssetFaceCreateDto,
  AssetFaceDeleteDto,
  AssetFaceResponseDto,
  FaceDto,
  PersonResponseDto,
} from 'src/dtos/person.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { PersonService } from 'src/services/person.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.Faces)
@Controller('faces')
export class FaceController {
  constructor(private service: PersonService) {}

  @Post()
  @Authenticated({ permission: Permission.FaceCreate })
  @ApiOperation({
    summary: 'Create a face',
    description:
      'Create a new face that has not been discovered by facial recognition. The content of the bounding box is considered a face.',
  })
  createFace(@Auth() auth: AuthDto, @Body() dto: AssetFaceCreateDto) {
    return this.service.createFace(auth, dto);
  }

  @Get()
  @Authenticated({ permission: Permission.FaceRead })
  @ApiOperation({
    summary: 'Retrieve faces for asset',
    description: 'Retrieve all faces belonging to an asset.',
  })
  getFaces(@Auth() auth: AuthDto, @Query() dto: FaceDto): Promise<AssetFaceResponseDto[]> {
    return this.service.getFacesById(auth, dto);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.FaceUpdate })
  @ApiOperation({
    summary: 'Re-assign a face to another person',
    description: 'Re-assign the face provided in the body to the person identified by the id in the path parameter.',
  })
  reassignFacesById(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: FaceDto,
  ): Promise<PersonResponseDto> {
    return this.service.reassignFacesById(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.FaceDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a face',
    description: 'Delete a face identified by the id. Optionally can be force deleted.',
  })
  deleteFace(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto, @Body() dto: AssetFaceDeleteDto): Promise<void> {
    return this.service.deleteFace(auth, id, dto);
  }
}
