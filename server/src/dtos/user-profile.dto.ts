import { ApiProperty } from '@nestjs/swagger';
import z from 'zod';
import { UploadFieldName } from 'src/dtos/asset-media.dto.js';
import { isoDatetimeToDate } from 'src/validation.js';
import { createZodDto } from 'src/zod.js';

export class CreateProfileImageDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Profile image file' })
  // `public` keeps babel (used by the import sorting prettier plugin) from parsing `[...]` as part of the decorator
  public [UploadFieldName.PROFILE_DATA]!: Express.Multer.File;
}

const CreateProfileImageResponseSchema = z
  .object({
    userId: z.uuidv4().describe('User ID'),
    profileChangedAt: isoDatetimeToDate.describe('Profile image change date'),
    profileImagePath: z.string().describe('Profile image file path'),
  })
  .meta({ id: 'CreateProfileImageResponseDto' });

export class CreateProfileImageResponseDto extends createZodDto(CreateProfileImageResponseSchema) {}
