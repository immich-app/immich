import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';

@Module({
  controllers: [TagController],
  providers: [TagService]
})
export class TagModule {}
