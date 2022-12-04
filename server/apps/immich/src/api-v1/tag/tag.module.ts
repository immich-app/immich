import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { TagEntity } from '@app/database/entities/tag.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@app/database/entities/user.entity';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { TagRepository, TAG_REPOSITORY } from './tag.repository';
import { UserModule } from '../user/user.module';

const TAG_REPOSITORY_PROVIDER = {
  provide: TAG_REPOSITORY,
  useClass: TagRepository,
};
@Module({
  imports: [TypeOrmModule.forFeature([TagEntity, UserEntity, AssetEntity]), UserModule],
  controllers: [TagController],
  providers: [TagService, TAG_REPOSITORY_PROVIDER],
  exports: [TAG_REPOSITORY_PROVIDER],
})
export class TagModule {}
