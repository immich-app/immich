import { LibraryService } from '@app/domain/library/library.service';
import { LibraryController } from '@app/immich/controllers';
import { LibraryEntity } from '@app/infra/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ILibraryRepository, LibraryRepository } from './library.repository';

@Module({
  imports: [TypeOrmModule.forFeature([LibraryEntity])],
  controllers: [LibraryController],
  providers: [LibraryService, { provide: ILibraryRepository, useClass: LibraryRepository }],
})
export class LibraryModule {}
