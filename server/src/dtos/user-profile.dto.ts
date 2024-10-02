import { ApiProperty } from '@nestjs/swagger';
import { UploadFieldName } from 'src/dtos/asset-media.dto';

export class CreateProfileImageDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  [UploadFieldName.PROFILE_DATA]!: Express.Multer.File;
}

export class CreateProfileImageResponseDto {
  userId!: string;
  profileChangedAt!: Date;
  profileImagePath!: string;
}
