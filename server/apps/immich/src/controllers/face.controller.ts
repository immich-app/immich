import { FacialRecognitionService, ImmichReadStream } from '@app/domain';
import { Controller, Get, Header, Param, StreamableFile } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Authenticated } from '../decorators/authenticated.decorator';
import { UseValidation } from '../decorators/use-validation.decorator';
import { UUIDParamDto } from './dto/uuid-param.dto';

function asStreamableFile({ stream, type, length }: ImmichReadStream) {
  return new StreamableFile(stream, { type, length });
}

@ApiTags('Face')
@Controller('face')
@Authenticated()
@UseValidation()
export class FaceController {
  constructor(private service: FacialRecognitionService) {}

  @Get('/thumbnail/:id')
  @Header('Cache-Control', 'max-age=31536000')
  @Header('Content-Type', 'image/jpeg')
  @ApiOkResponse({ content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } })
  async getFaceThumbnail(@Param() { id }: UUIDParamDto) {
    return this.service.getFaceThumbnail(id).then(asStreamableFile);
  }
}
