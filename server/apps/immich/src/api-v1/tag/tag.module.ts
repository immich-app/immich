import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { TagEntity } from '@app/infra/db/entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagRepository, ITagRepository } from './tag.repository';

const TAG_REPOSITORY_PROVIDER = {
  provide: ITagRepository,
  useClass: TagRepository,
};
@Module({
  imports: [TypeOrmModule.forFeature([TagEntity])],
  controllers: [TagController],
  providers: [TagService, TAG_REPOSITORY_PROVIDER],
  exports: [TAG_REPOSITORY_PROVIDER],
})
export class TagModule {}
