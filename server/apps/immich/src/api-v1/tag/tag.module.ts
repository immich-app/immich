import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { TagEntity } from '@app/database/entities/tag.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@app/database/entities/user.entity';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { TagRepository } from './tag.repository';
import { UserRepository } from '../user/user-repository';

@Module({
  imports: [TypeOrmModule.forFeature([TagEntity, UserEntity, AssetEntity])],
  controllers: [TagController],
  providers: [
    TagService,
    {
      provide: 'TAG_REPOSITORY',
      useClass: TagRepository,
    },
    {
      provide: 'USER_REPOSITORY',
      useClass: UserRepository,
    },
  ],
})
export class TagModule {}
