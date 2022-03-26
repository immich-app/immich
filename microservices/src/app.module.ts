import { Module } from '@nestjs/common';
import { ImageClassifierModule } from './image-classifier/image-classifier.module';
import { databaseConfig } from './config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObjectDetectionModule } from './object-detection/object-detection.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    ImageClassifierModule,
    ObjectDetectionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
