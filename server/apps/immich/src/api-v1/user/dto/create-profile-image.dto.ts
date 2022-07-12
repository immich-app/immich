import { ApiProperty } from '@nestjs/swagger';
import { Express } from 'express';

export class CreateProfileImageDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file!: Express.Multer.File;
}
