import { Module } from '@nestjs/common';
import { ImageClassifierModule } from './image-classifier/image-classifier.module';
import { ObjectDetectionModule } from './object-detection/object-detection.module';

@Module({
  imports: [ImageClassifierModule, ObjectDetectionModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
