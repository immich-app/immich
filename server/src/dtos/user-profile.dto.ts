import { createZodDto } from '@immich/nestjs-standard-schema/zod';
import { ApiProperty } from '@nestjs/swagger';
import z from 'zod';
import { UploadFieldName } from 'src/dtos/asset-media.dto.js';
import { isoDatetimeToDate } from 'src/validation.js';

export class CreateProfileImageDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Profile image file' })
  // `public` keeps babel (used by the import sorting prettier plugin) from parsing `[...]` as part of the decorator
  public [UploadFieldName.PROFILE_DATA]!: Express.Multer.File;
}

export class CreateProfileImageResponseDto extends createZodDto({
  userId: z.uuidv4().describe('User ID'),
  profileChangedAt: isoDatetimeToDate.describe('Profile image change date'),
  profileImagePath: z.string().describe('Profile image file path'),
}) {}
