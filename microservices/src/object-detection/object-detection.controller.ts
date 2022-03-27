import { Body, Controller, Post } from '@nestjs/common';
import { ObjectDetectionService } from './object-detection.service';

@Controller('object-detection')
export class ObjectDetectionController {
  constructor(
    private readonly objectDetectionService: ObjectDetectionService,
  ) {}

  @Post('/detectObject')
  async detectObject(@Body('thumbnailPath') thumbnailPath: string) {
    return await this.objectDetectionService.detectObject(thumbnailPath);
  }
}
