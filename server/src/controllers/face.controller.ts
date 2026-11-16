import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { Endpoint, HistoryBuilder } from 'src/decorators.js';
import type { AuthDto } from 'src/dtos/auth.dto.js';
import { FaceRecognitionDto, FaceRecognitionResponseDto } from 'src/dtos/face.dto.js';
import {
  AssetFaceCreateDto,
  AssetFaceDeleteDto,
  AssetFaceResponseDto,
  FaceDto,
  PersonResponseDto,
} from 'src/dtos/person.dto.js';
import { ApiTag, Permission } from 'src/enum.js';
import { Auth, Authenticated } from 'src/middleware/auth.guard.js';
import { PersonService } from 'src/services/person.service.js';
import { HumanReadableSize } from 'src/utils/bytes.js';
import { UUIDParamDto } from 'src/validation.js';

@ApiTags(ApiTag.Faces)
@Controller('faces')
export class FaceController {
  constructor(private service: PersonService) {}

  @Post('recognize')
  @HttpCode(HttpStatus.OK)
  @Authenticated({ permission: Permission.PersonRead })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FaceRecognitionDto })
  @Endpoint({
    summary: 'Recognize faces in an image',
    description:
      "Match faces against existing, non-hidden people using only the authenticated user's timeline and archived photos. The image is processed without being saved. Uses the configured facial recognition model and distance threshold.",
    history: new HistoryBuilder().added('v3.4.0').alpha('v3.4.0'),
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * HumanReadableSize.MiB, files: 1, fields: 0 },
    }),
  )
  recognizeFaces(
    @Auth() auth: AuthDto,
    @UploadedFile(new ParseFilePipe({ validators: [new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ })] }))
    file: Express.Multer.File,
  ): Promise<FaceRecognitionResponseDto> {
    return this.service.recognizeFaces(auth, file);
  }

  @Post()
  @Authenticated({ permission: Permission.FaceCreate })
  @Endpoint({
    summary: 'Create a face',
    description:
      'Create a new face that has not been discovered by facial recognition. The content of the bounding box is considered a face.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  createFace(@Auth() auth: AuthDto, @Body() dto: AssetFaceCreateDto) {
    return this.service.createFace(auth, dto);
  }

  @Get()
  @Authenticated({ permission: Permission.FaceRead })
  @Endpoint({
    summary: 'Retrieve faces for asset',
    description: 'Retrieve all faces belonging to an asset.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getFaces(@Auth() auth: AuthDto, @Query() dto: FaceDto): Promise<AssetFaceResponseDto[]> {
    return this.service.getFacesById(auth, dto);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.FaceUpdate })
  @Endpoint({
    summary: 'Re-assign a face to another person',
    description: 'Re-assign the face provided in the body to the person identified by the id in the path parameter.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
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
  @Endpoint({
    summary: 'Delete a face',
    description: 'Delete a face identified by the id. Optionally can be force deleted.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  deleteFace(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto, @Body() dto: AssetFaceDeleteDto): Promise<void> {
    return this.service.deleteFace(auth, id, dto);
  }
}
