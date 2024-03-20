import { ApiProperty } from '@nestjs/swagger';
import { UploadFieldName } from 'src/domain/asset/asset.service';

export class CreateProfileImageDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  [UploadFieldName.PROFILE_DATA]!: Express.Multer.File;
}
