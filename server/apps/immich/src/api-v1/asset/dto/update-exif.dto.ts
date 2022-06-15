import { PartialType } from '@nestjs/mapped-types';
import { CreateExifDto } from './create-exif.dto';

export class UpdateExifDto extends PartialType(CreateExifDto) {}
