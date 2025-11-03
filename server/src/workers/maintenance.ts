import { MaintenanceModule } from 'src/app.module';
import { isStartUpError } from 'src/utils/misc';
import { bootstrapApi } from 'src/workers/api';

// eslint-disable-next-line unicorn/prefer-module
if (require.main === module) {
  bootstrapApi('immich-maintenance', MaintenanceModule).catch((error) => {
    if (!isStartUpError(error)) {
      console.error(error);
    }
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  });
}
