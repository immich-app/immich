import { Body, Controller, Post } from '@nestjs/common';
import { ObjectDetectionService } from './object-detection.service';
import { Logger } from '@nestjs/common';

@Controller('object-detection')
export class ObjectDetectionController {
  constructor(
    private readonly objectDetectionService: ObjectDetectionService,
  ) { }

  @Post('/detectObject')
  async detectObject(@Body('thumbnailPath') thumbnailPath: string) {
    return await this.objectDetectionService.detectObject(thumbnailPath);
  }
}
