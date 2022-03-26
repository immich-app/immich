import { ConsoleLogger, Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ImageClassifierService } from './image-classifier.service';
import { CreateImageClassifierDto } from './dto/create-image-classifier.dto';

@Controller()
export class ImageClassifierController {
  constructor(
    private readonly imageClassifierService: ImageClassifierService,
  ) {}

  @MessagePattern('tagImage')
  // tagImage(@Payload() createImageClassifierDto: CreateImageClassifierDto) {
  tagImage(@Payload() createImageClassifierDto: CreateImageClassifierDto) {
    console.log('Tagging image in microservice', createImageClassifierDto);
    return this.imageClassifierService.tagImage(createImageClassifierDto);
  }
}
