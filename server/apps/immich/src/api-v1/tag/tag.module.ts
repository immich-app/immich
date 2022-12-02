import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { TagEntity } from '@app/database/entities/tag.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@app/database/entities/user.entity';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { TagRepository, TAG_REPOSITORY } from './tag.repository';
import { UserRepository, USER_REPOSITORY } from '../user/user-repository';

const TAG_REPOSITORY_PROVIDER = {
  provide: TAG_REPOSITORY,
  useClass: TagRepository,
};
@Module({
  imports: [TypeOrmModule.forFeature([TagEntity, UserEntity, AssetEntity])],
  controllers: [TagController],
  providers: [
    TagService,
    TAG_REPOSITORY_PROVIDER,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
  exports: [TagService],
})
export class TagModule {}
