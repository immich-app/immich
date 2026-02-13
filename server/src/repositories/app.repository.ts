import { Injectable } from '@nestjs/common';
import { ExitCode } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { AppRestartEvent } from 'src/repositories/event.repository';

@Injectable()
export class AppRepository {
  private closeFn?: () => Promise<void>;

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

  async sendOneShotAppRestart(state: AppRestartEvent): Promise<void> {
    const { port } = new ConfigRepository().getEnv();
    const url = `http://127.0.0.1:${port}/api/internal/restart`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });

    if (!response.ok) {
      throw new Error(`Failed to trigger app restart: ${response.status} ${response.statusText}`);
    }
  }
}
