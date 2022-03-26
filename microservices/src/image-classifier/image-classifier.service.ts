import { Injectable } from '@nestjs/common';
import { CreateImageClassifierDto } from './dto/create-image-classifier.dto';
import { UpdateImageClassifierDto } from './dto/update-image-classifier.dto';

@Injectable()
export class ImageClassifierService {
  tagImage(createImageClassifierDto: CreateImageClassifierDto) {
    return 'This action adds a new imageClassifier';
  }
}
