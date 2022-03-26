import { Module } from '@nestjs/common';
import { ObjectDetectionService } from './object-detection.service';
import { ObjectDetectionController } from './object-detection.controller';

@Module({
  controllers: [ObjectDetectionController],
  providers: [ObjectDetectionService],
})
export class ObjectDetectionModule {}
