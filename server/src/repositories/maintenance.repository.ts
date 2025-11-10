import { Injectable } from '@nestjs/common';
import { ExitCode } from 'src/enum';

@Injectable()
export class MaintenanceRepository {
  private closeFn?: () => Promise<void>;

  constructor() {}

  exitApp() {
    /* eslint-disable unicorn/no-process-exit */
    void this.closeFn?.().finally(() => process.exit(ExitCode.AppRestart));

    // in exceptional circumstance, the application may hang
    setTimeout(() => process.exit(ExitCode.AppRestart), 2000);
    /* eslint-enable unicorn/no-process-exit */
  }

  setCloseFn(fn: () => Promise<void>) {
    this.closeFn = fn;
  }
}
