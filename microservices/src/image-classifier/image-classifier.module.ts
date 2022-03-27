import { Module } from '@nestjs/common';
import { ImageClassifierService } from './image-classifier.service';
import { ImageClassifierController } from './image-classifier.controller';

@Module({
  controllers: [ImageClassifierController],
  providers: [ImageClassifierService],
})
export class ImageClassifierModule {}
