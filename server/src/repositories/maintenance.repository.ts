import { Injectable } from '@nestjs/common';
import { ExitCode } from 'src/enum';

@Injectable()
export class MaintenanceRepository {
  private closeFn?: () => Promise<void>;

  constructor() {}

  exitApp() {
    /* eslint-disable unicorn/no-process-exit */
    void this.closeFn?.().then(() => process.exit(ExitCode.AppRestart));

    // in exceptional circumstance, the application may hang
    setTimeout(() => process.exit(ExitCode.AppRestart), 5000);
    /* eslint-enable unicorn/no-process-exit */
  }

  setCloseFn(fn: () => Promise<void>) {
    this.closeFn = fn;
  }
}
