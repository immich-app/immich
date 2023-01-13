import { StorageModule } from '@app/storage';
import { Module, OnModuleInit } from '@nestjs/common';
import { AssetModule } from '../../api-v1/asset/asset.module';
import { ImportTaskService } from './import-task.service';

@Module({
  imports: [AssetModule, StorageModule],
  providers: [ImportTaskService],
  exports: [ImportTaskService],
})
export class ImportTaskModule implements OnModuleInit {
  constructor(private importTaskService: ImportTaskService) {}

  onModuleInit() {
    this.importTaskService.start();
  }
}
