import { Controller } from '@nestjs/common';
import { ObjectDetectionService } from './object-detection.service';

@Controller('object-detection')
export class ObjectDetectionController {
  constructor(private readonly objectDetectionService: ObjectDetectionService) {}
}
