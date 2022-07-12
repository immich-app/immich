import { ApiProperty } from '@nestjs/swagger';
import { Express } from 'express';

export class CreateProfileImageDto {
  @ApiProperty({ type: 'file' })
  file!: Express.Multer.File;
}
