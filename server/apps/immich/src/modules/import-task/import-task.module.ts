import { Module } from '@nestjs/common';
import { AssetModule } from '../../api-v1/asset/asset.module';
import { UserModule } from '../../api-v1/user/user.module';
import { ImportTaskService } from './import-task.service';

@Module({
  imports: [AssetModule, UserModule],
  providers: [ImportTaskService],
  exports: [ImportTaskService],
})
export class ImportTaskModule {}
