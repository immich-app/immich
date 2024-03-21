import { ApiProperty } from '@nestjs/swagger';
import { UploadFieldName } from 'src/dtos/asset.dto';
import { UserAvatarColor, UserEntity } from 'src/entities/user.entity';

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

export const getRandomAvatarColor = (user: UserEntity): UserAvatarColor => {
  const values = Object.values(UserAvatarColor);
  const randomIndex = Math.floor(
    [...user.email].map((letter) => letter.codePointAt(0) ?? 0).reduce((a, b) => a + b, 0) % values.length,
  );
  return values[randomIndex] as UserAvatarColor;
};
