import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from '../../api-v1/asset/entities/asset.entity';
import { ImageConversionService } from './image-conversion.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssetEntity]),
  ],
  providers: [ImageConversionService],
})
export class ScheduleTasksModule { }
