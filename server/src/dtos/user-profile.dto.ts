import { ApiProperty } from '@nestjs/swagger';
import { UploadFieldName } from 'src/dtos/asset-media.dto';

export class CreateProfileImageDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Profile image file' })
  [UploadFieldName.PROFILE_DATA]!: Express.Multer.File;
}

export class CreateProfileImageResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId!: string;
  @ApiProperty({ description: 'Profile image change date', format: 'date-time' })
  profileChangedAt!: Date;
  @ApiProperty({ description: 'Profile image file path' })
  profileImagePath!: string;
}
