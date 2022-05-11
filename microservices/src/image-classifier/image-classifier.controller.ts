import { Body, Controller, Post } from '@nestjs/common';
import { ImageClassifierService } from './image-classifier.service';

@Controller('image-classifier')
export class ImageClassifierController {
  constructor(
    private readonly imageClassifierService: ImageClassifierService,
  ) { }

  @Post('/tagImage')
  async tagImage(@Body('thumbnailPath') thumbnailPath: string) {
    return await this.imageClassifierService.tagImage(thumbnailPath);
  }
}
