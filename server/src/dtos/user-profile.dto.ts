import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { UploadFieldName } from 'src/dtos/asset-media.dto';
import { isoDatetimeToDate } from 'src/validation';
import z from 'zod';

export class CreateProfileImageDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Profile image file' })
  [UploadFieldName.PROFILE_DATA]!: Express.Multer.File;
}

const CreateProfileImageResponseSchema = z
  .object({
    userId: z.string().describe('User ID'),
    profileChangedAt: isoDatetimeToDate.describe('Profile image change date'),
    profileImagePath: z.string().describe('Profile image file path'),
  })
  .meta({ id: 'CreateProfileImageResponseDto' });

export class CreateProfileImageResponseDto extends createZodDto(CreateProfileImageResponseSchema) {}
