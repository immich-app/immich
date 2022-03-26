import { Module } from '@nestjs/common';
import { ImageClassifierService } from './image-classifier/image-classifier.service';
import { ImageClassifierModule } from './image-classifier/image-classifier.module';
import { databaseConfig } from './config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [ImageClassifierModule, TypeOrmModule.forRoot(databaseConfig)],

  controllers: [],
  providers: [ImageClassifierService],
})
export class AppModule {}
