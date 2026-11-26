import { Spy } from '#test/common/expectations.ts';
import type { ConsoleMessage, Page } from '@playwright/test';

export class MockConsole {
  readonly error = new Spy<string>('logger.error');
  private page?: Page;

  private readonly onPageError = (error: Error) => {
    this.error.record(`[pageerror] ${error.stack ?? error.message}`, { expected: true });
  };

  private readonly onConsole = (message: ConsoleMessage) => {
    if (message.type() === 'error') {
      this.error.record(`[console.error] ${message.text()}`, { expected: true });
    }
  };

  setup(page: Page) {
    this.page = page;
    page.on('pageerror', this.onPageError);
    page.on('console', this.onConsole);
  }

  teardown() {
    this.page?.off('pageerror', this.onPageError);
    this.page?.off('console', this.onConsole);
    this.page = undefined;
  }
}
