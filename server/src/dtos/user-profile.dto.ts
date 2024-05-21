import { ApiProperty } from '@nestjs/swagger';
import { UploadFieldName } from 'src/dtos/asset.dto';

export class CreateProfileImageDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  [UploadFieldName.PROFILE_DATA]!: Express.Multer.File;
}

export class CreateProfileImageResponseDto {
  userId!: string;
  profileImagePath!: string;
}

export function mapCreateProfileImageResponse(userId: string, profileImagePath: string): CreateProfileImageResponseDto {
  return {
    userId: userId,
    profileImagePath: profileImagePath,
  };
}
