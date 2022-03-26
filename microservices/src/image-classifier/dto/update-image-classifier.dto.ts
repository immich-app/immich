import { PartialType } from '@nestjs/mapped-types';
import { CreateImageClassifierDto } from './create-image-classifier.dto';

export class UpdateImageClassifierDto extends PartialType(CreateImageClassifierDto) {
  id: number;
}
